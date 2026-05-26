#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uBaseTexture;
uniform sampler2D uEdgeTexture;
uniform vec3 uLineColour;
uniform vec2 uTexelSize;
uniform int uDilatePasses;
out vec4 fragColor;

void main() {
    vec4 base = texture(uBaseTexture, vTexCoord);

    float maxEdge = 0.0;
    for (int x = -4; x <= 4; x++) {
        for (int y = -4; y <= 4; y++) {
            if (abs(x) > uDilatePasses || abs(y) > uDilatePasses) continue;
            vec2 offset = vec2(float(x), float(y)) * uTexelSize;
            float e = texture(uEdgeTexture, vTexCoord + offset).r;
            maxEdge = max(maxEdge, e);
        }
    }

    vec3 blended = base.rgb * (1.0 - maxEdge) + uLineColour * maxEdge;
    fragColor = vec4(blended, base.a);
}
