#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float uEdgeThreshold;
uniform float uEdgeStrength;
out vec4 fragColor;

float luminance(vec3 c) {
    return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

void main() {
    ivec2 texSize = textureSize(uTexture, 0);
    vec2 ts = vec2(1.0) / vec2(texSize);

    vec3 tl = texture(uTexture, vTexCoord + vec2(-1.0, -1.0) * ts).rgb;
    vec3 t  = texture(uTexture, vTexCoord + vec2( 0.0, -1.0) * ts).rgb;
    vec3 tr = texture(uTexture, vTexCoord + vec2( 1.0, -1.0) * ts).rgb;
    vec3 l  = texture(uTexture, vTexCoord + vec2(-1.0,  0.0) * ts).rgb;
    vec3 r  = texture(uTexture, vTexCoord + vec2( 1.0,  0.0) * ts).rgb;
    vec3 bl = texture(uTexture, vTexCoord + vec2(-1.0,  1.0) * ts).rgb;
    vec3 b  = texture(uTexture, vTexCoord + vec2( 0.0,  1.0) * ts).rgb;
    vec3 br = texture(uTexture, vTexCoord + vec2( 1.0,  1.0) * ts).rgb;

    float l_tl = luminance(tl), l_t = luminance(t), l_tr = luminance(tr);
    float l_l  = luminance(l),  l_r  = luminance(r);
    float l_bl = luminance(bl), l_b = luminance(b), l_br = luminance(br);

    float gx = -l_tl + l_tr - 2.0 * l_l + 2.0 * l_r - l_bl + l_br;
    float gy = -l_tl - 2.0 * l_t - l_tr + l_bl + 2.0 * l_b + l_br;

    float magnitude = sqrt(gx * gx + gy * gy) / 4.0;

    float edge = magnitude > uEdgeThreshold ? magnitude * uEdgeStrength : 0.0;
    fragColor = vec4(vec3(edge), 1.0);
}
