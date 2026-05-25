import type { Renderer, RenderRequest, RenderResult } from "@/rendering/Renderer";
import type { FilterSettings } from "@/types";
import vertexSrc from "@/rendering/shaders/fullscreen.vert";
import smoothFrag from "@/rendering/shaders/smooth.frag";
import colorCorrectFrag from "@/rendering/shaders/colorCorrect.frag";
import posterizeFrag from "@/rendering/shaders/posterize.frag";
import edgeDetectFrag from "@/rendering/shaders/edgeDetect.frag";
import compositeFrag from "@/rendering/shaders/composite.frag";

const MAX_PREVIEW_DIMENSION = 1920;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Failed to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile error: ${log}`);
  }
  return shader;
}

function linkProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragSrc);
  const program = gl.createProgram();
  if (!program) throw new Error("Failed to create program");
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Program link error: ${log}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

function createTexture2D(gl: WebGL2RenderingContext, w: number, h: number): WebGLTexture {
  const tex = gl.createTexture();
  if (!tex) throw new Error("Failed to create texture");
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, w, h);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function createFBO(gl: WebGL2RenderingContext, tex: WebGLTexture): WebGLFramebuffer {
  const fbo = gl.createFramebuffer();
  if (!fbo) throw new Error("Failed to create framebuffer");
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    throw new Error(`Framebuffer not complete: ${status}`);
  }
  return fbo;
}

function hexToRgb(hex: string): Float32Array {
  const value = parseInt(hex.slice(1), 16);
  return new Float32Array([
    ((value >> 16) & 0xff) / 255,
    ((value >> 8) & 0xff) / 255,
    (value & 0xff) / 255,
  ]);
}

function destroyTexture(gl: WebGL2RenderingContext, tex: WebGLTexture | null): void {
  if (tex) gl.deleteTexture(tex);
}

function destroyFBO(gl: WebGL2RenderingContext, fbo: WebGLFramebuffer | null): void {
  if (fbo) gl.deleteFramebuffer(fbo);
}

function destroyProgram(gl: WebGL2RenderingContext, program: WebGLProgram | null): void {
  if (program) gl.deleteProgram(program);
}

type FBOResource = {
  fbo: WebGLFramebuffer;
  tex: WebGLTexture;
};

function createFBOResource(gl: WebGL2RenderingContext, w: number, h: number): FBOResource {
  const tex = createTexture2D(gl, w, h);
  const fbo = createFBO(gl, tex);
  return { fbo, tex };
}

function destroyFBOResource(gl: WebGL2RenderingContext, r: FBOResource | null): void {
  if (r) {
    destroyTexture(gl, r.tex);
    destroyFBO(gl, r.fbo);
  }
}

export class WebGLRenderer implements Renderer {
  private gl: WebGL2RenderingContext;
  private canvas: OffscreenCanvas;
  private targetW = 0;
  private targetH = 0;

  private smoothProgram: WebGLProgram;
  private colorCorrectProgram: WebGLProgram;
  private posterizeProgram: WebGLProgram;
  private edgeDetectProgram: WebGLProgram;
  private compositeProgram: WebGLProgram;

  private vao: WebGLVertexArrayObject;
  private positionBuf: WebGLBuffer;
  private texCoordBuf: WebGLBuffer;

  private sourceTexture: WebGLTexture | null = null;
  private fboA: FBOResource | null = null;
  private fboB: FBOResource | null = null;
  private fboC: FBOResource | null = null;

  constructor() {
    this.canvas = new OffscreenCanvas(1, 1);
    const gl = this.canvas.getContext("webgl2", {
      premultipliedAlpha: false,
      alpha: true,
    });
    if (!gl) throw new Error("WebGL2 not available");
    this.gl = gl;

    this.smoothProgram = linkProgram(gl, vertexSrc, smoothFrag);
    this.colorCorrectProgram = linkProgram(gl, vertexSrc, colorCorrectFrag);
    this.posterizeProgram = linkProgram(gl, vertexSrc, posterizeFrag);
    this.edgeDetectProgram = linkProgram(gl, vertexSrc, edgeDetectFrag);
    this.compositeProgram = linkProgram(gl, vertexSrc, compositeFrag);

    const vao = gl.createVertexArray();
    if (!vao) throw new Error("Failed to create VAO");
    this.vao = vao;
    gl.bindVertexArray(this.vao);

    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this.positionBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const texCoords = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
    this.texCoordBuf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuf);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(null);
  }

  async render(request: RenderRequest): Promise<RenderResult> {
    const { source, sourceId: _sourceId, settings } = request;
    void _sourceId;

    const scale = Math.min(
      1,
      MAX_PREVIEW_DIMENSION / Math.max(source.width, source.height),
    );
    const w = Math.round(source.width * scale);
    const h = Math.round(source.height * scale);

    if (w !== this.targetW || h !== this.targetH) {
      this.resize(w, h);
    }

    gl: {
      const gl = this.gl;
      gl.viewport(0, 0, w, h);
    }
    this.uploadSource(source);
    this.runPipeline(settings);

    const bitmap = this.canvas.transferToImageBitmap();
    return { bitmap };
  }

  destroy(): void {
    const gl = this.gl;
    destroyTexture(gl, this.sourceTexture);
    destroyFBOResource(gl, this.fboA);
    destroyFBOResource(gl, this.fboB);
    destroyFBOResource(gl, this.fboC);
    destroyProgram(gl, this.smoothProgram);
    destroyProgram(gl, this.colorCorrectProgram);
    destroyProgram(gl, this.posterizeProgram);
    destroyProgram(gl, this.edgeDetectProgram);
    destroyProgram(gl, this.compositeProgram);
    gl.deleteBuffer(this.positionBuf);
    gl.deleteBuffer(this.texCoordBuf);
    gl.deleteVertexArray(this.vao);
  }

  private resize(w: number, h: number): void {
    const gl = this.gl;
    this.targetW = w;
    this.targetH = h;
    this.canvas.width = w;
    this.canvas.height = h;

    destroyTexture(gl, this.sourceTexture);
    destroyFBOResource(gl, this.fboA);
    destroyFBOResource(gl, this.fboB);
    destroyFBOResource(gl, this.fboC);

    this.sourceTexture = createTexture2D(gl, w, h);
    this.fboA = createFBOResource(gl, w, h);
    this.fboB = createFBOResource(gl, w, h);
    this.fboC = createFBOResource(gl, w, h);
  }

  private uploadSource(bitmap: ImageBitmap): void {
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTexture);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
  }

  private runPipeline(settings: FilterSettings): void {
    const gl = this.gl;
    const texelSize = new Float32Array([1 / this.targetW, 1 / this.targetH]);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(this.vao);

    // Smooth passes
    const smoothPasses =
      Math.round(settings.smoothing * 3) ||
      (settings.smoothing > 0.01 ? 1 : 0);

    let currentTex: WebGLTexture = this.sourceTexture!;

    if (smoothPasses > 0) {
      for (let i = 0; i < smoothPasses; i++) {
        const target = i % 2 === 0 ? this.fboA! : this.fboB!;
        this.runPass(this.smoothProgram, [{ name: "uTexture", texture: currentTex, unit: 0 }], target.fbo, {
          uTexelSize: texelSize,
        });
        currentTex = target.tex;
      }
    }

    // Color correct → always write to the opposite FBO from where the result sits
    const ccTarget = currentTex === this.fboA?.tex ? this.fboB! : this.fboA!;
    this.runPass(
      this.colorCorrectProgram,
      [{ name: "uTexture", texture: currentTex, unit: 0 }],
      ccTarget.fbo,
      {
        uContrast: settings.contrast,
        uSaturation: settings.saturation,
        uShadowBias: settings.shadowBias,
      },
    );
    currentTex = ccTarget.tex;

    // Posterize → fboC (saved for composite)
    this.runPass(
      this.posterizeProgram,
      [{ name: "uTexture", texture: currentTex, unit: 0 }],
      this.fboC!.fbo,
      { uColourLevels: settings.colourLevels },
    );
    const posterizedTex = this.fboC!.tex;

    // Edge detect → the FBO not holding posterized
    const edgeTarget = this.fboA === this.fboC ? this.fboB! : this.fboA!;
    this.runPass(
      this.edgeDetectProgram,
      [{ name: "uTexture", texture: posterizedTex, unit: 0 }],
      edgeTarget.fbo,
      {
        uTexelSize: texelSize,
        uEdgeThreshold: settings.edgeThreshold,
        uEdgeStrength: settings.edgeStrength,
      },
    );
    const edgeTex = edgeTarget.tex;

    // Composite → default framebuffer (drawing buffer)
    this.runPass(
      this.compositeProgram,
      [
        { name: "uBaseTexture", texture: posterizedTex, unit: 0 },
        { name: "uEdgeTexture", texture: edgeTex, unit: 1 },
      ],
      null,
      {
        uLineColour: hexToRgb(settings.lineColour),
        uTexelSize: texelSize,
        uEdgeThickness: settings.edgeThickness,
      },
    );

    gl.bindVertexArray(null);
  }

  private runPass(
    program: WebGLProgram,
    inputs: Array<{ name: string; texture: WebGLTexture; unit: number }>,
    outputFbo: WebGLFramebuffer | null,
    uniforms: Record<string, unknown>,
  ): void {
    const gl = this.gl;
    gl.useProgram(program);

    for (const { name, texture, unit } of inputs) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      const loc = gl.getUniformLocation(program, name);
      if (loc !== null) gl.uniform1i(loc, unit);
    }

    for (const [key, value] of Object.entries(uniforms)) {
      const loc = gl.getUniformLocation(program, key);
      if (loc === null) continue;
      if (value instanceof Float32Array) {
        if (value.length === 2) gl.uniform2fv(loc, value);
        else if (value.length === 3) gl.uniform3fv(loc, value);
        else if (value.length === 4) gl.uniform4fv(loc, value);
      } else if (typeof value === "number") {
        gl.uniform1f(loc, value);
      } else if (typeof value === "boolean") {
        gl.uniform1i(loc, value ? 1 : 0);
      }
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, outputFbo);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
}
