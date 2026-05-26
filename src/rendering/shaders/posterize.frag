#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float uColourLevels;
out vec4 fragColor;

void main() {
    vec4 color = texture(uTexture, vTexCoord);
    if (uColourLevels < 2.0) {
        fragColor = color;
        return;
    }
    float factor = uColourLevels - 1.0;
    vec3 quantized = floor(color.rgb * factor + 0.5) / factor;
    fragColor = vec4(quantized, color.a);
}
