uniform vec2 u_resolution;
uniform float u_fov;

const float g_rmEpsilon = 0.0001;
const int maxSteps = 32;

@import(shaders/lib/primitives.glsl)

float distanceField(vec3 p) {
    return max(
        -spherePrimitive(p, 0.6),
        boxPrimitive(p, vec3(0.5))
    );
}

void main() {
    vec3 eye = vec3(0.0, 0.0, -1);
    vec3 up = vec3(0, 1.0, 0.0);
    vec3 right = vec3(1.0, 0.0, 0.0);

    float u = gl_FragCoord.x * 2.0 / u_resolution.x - 1.0;
    float v = gl_FragCoord.y * 2.0 / u_resolution.y - 1.0;
    vec3 ro = right * u + up * v;
    vec3 rd = normalize(cross(right, up));

    vec4 color = vec4(0.0); // Sky color

    float t = 0.0;
    
    for(int i = 0; i < maxSteps; ++i) {
        vec3 p = eye + ro + rd * u_fov * t;
        float d = distanceField(p);

        if(d < g_rmEpsilon) {
            color = vec4(1.0); // Sphere color
            break;
        }

        t += d;
    }

    gl_FragColor = color;
}