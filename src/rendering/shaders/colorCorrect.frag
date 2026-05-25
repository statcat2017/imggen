#version 300 es
precision mediump float;
in vec2 vTexCoord;
uniform sampler2D uTexture;
uniform float uContrast;
uniform float uSaturation;
uniform float uShadowBias;
out vec4 fragColor;

vec3 rgbToHsl(vec3 rgb) {
    float r = rgb.r, g = rgb.g, b = rgb.b;
    float maxC = max(max(r, g), b);
    float minC = min(min(r, g), b);
    float l = (maxC + minC) / 2.0;
    if (maxC == minC) return vec3(0.0, 0.0, l);
    float d = maxC - minC;
    float s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);
    float h;
    if (maxC == r) h = (g - b) / d + (g < b ? 6.0 : 0.0);
    else if (maxC == g) h = (b - r) / d + 2.0;
    else h = (r - g) / d + 4.0;
    h /= 6.0;
    return vec3(h, s, l);
}

float hue2rgb(float p, float q, float t) {
    if (t < 0.0) t += 1.0;
    if (t > 1.0) t -= 1.0;
    if (t < 1.0 / 6.0) return p + (q - p) * 6.0 * t;
    if (t < 1.0 / 2.0) return q;
    if (t < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - t) * 6.0;
    return p;
}

vec3 hslToRgb(vec3 hsl) {
    float h = hsl.x, s = hsl.y, l = hsl.z;
    if (s == 0.0) return vec3(l);
    float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
    float p = 2.0 * l - q;
    return vec3(hue2rgb(p, q, h + 1.0 / 3.0), hue2rgb(p, q, h), hue2rgb(p, q, h - 1.0 / 3.0));
}

void main() {
    vec4 color = texture(uTexture, vTexCoord);
    vec3 rgb = color.rgb;

    rgb = (rgb - 0.5) * uContrast + 0.5;
    rgb += uShadowBias;
    rgb = clamp(rgb, 0.0, 1.0);

    if (abs(uSaturation - 1.0) > 0.001) {
        vec3 hsl = rgbToHsl(rgb);
        hsl.y = clamp(hsl.y * uSaturation, 0.0, 1.0);
        rgb = hslToRgb(hsl);
    }

    fragColor = vec4(clamp(rgb, 0.0, 1.0), color.a);
}
