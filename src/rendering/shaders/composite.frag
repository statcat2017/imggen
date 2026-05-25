#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uBaseTexture;
uniform sampler2D uEdgeTexture;
uniform vec3 uLineColour;
uniform vec2 uTexelSize;
uniform float uEdgeThickness;
out vec4 fragColor;

void main() {
    vec4 base = texture(uBaseTexture, vTexCoord);

    int passes = int(round(uEdgeThickness / 2.0));
    passes = clamp(passes, 0, 4);

    int radius = passes;
    float maxEdge = 0.0;
    for (int x = -radius; x <= radius; x++) {
        for (int y = -radius; y <= radius; y++) {
            vec2 offset = vec2(float(x), float(y)) * uTexelSize;
            float e = texture(uEdgeTexture, vTexCoord + offset).r;
            maxEdge = max(maxEdge, e);
        }
    }

    vec3 blended = base.rgb * (1.0 - maxEdge) + uLineColour * maxEdge;
    fragColor = vec4(blended, base.a);
}
