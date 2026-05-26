#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uTexture;
out vec4 fragColor;

void main() {
    ivec2 texSize = textureSize(uTexture, 0);
    vec2 ts = vec2(1.0) / vec2(texSize);

    vec4 sum = vec4(0.0);
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 offset = vec2(float(x), float(y)) * ts;
            sum += texture(uTexture, vTexCoord + offset);
        }
    }
    fragColor = sum / 9.0;
}
