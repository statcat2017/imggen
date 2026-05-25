#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform vec2 uTexelSize;
out vec4 fragColor;

void main() {
    ivec2 texSize = textureSize(uTexture, 0);
    vec2 ts = vec2(1.0) / vec2(texSize);

    float maxVal = 0.0;
    for (int x = -1; x <= 1; x++) {
        for (int y = -1; y <= 1; y++) {
            vec2 offset = vec2(float(x), float(y)) * ts;
            float val = texture(uTexture, vTexCoord + offset).r;
            maxVal = max(maxVal, val);
        }
    }
    fragColor = vec4(vec3(maxVal), 1.0);
}
