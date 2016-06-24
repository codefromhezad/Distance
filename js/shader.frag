uniform vec2 resolution;

void main() {
    float g_rmEpsilon = 0.0001;
    vec3 eye = vec3(0, 0, -1);
    vec3 up = vec3(0, 1, 0);
    vec3 right = vec3(1, 0, 0);

    float u = gl_FragCoord.x * 2.0 / resolution.x - 1.0;
    float v = gl_FragCoord.y * 2.0 / resolution.y - 1.0;
    vec3 ro = right * u + up * v;
    vec3 rd = normalize(cross(right, up));

    vec4 color = vec4(0.0); // Sky color

    float t = 0.0;
    const int maxSteps = 32;
    for(int i = 0; i < maxSteps; ++i)
    {
        vec3 p = ro + rd * t;
        float d = length(p) - 0.5; // Distance to sphere of radius 0.5
        if(d < g_rmEpsilon)
        {
            color = vec4(1.0); // Sphere color
            break;
        }

        t += d;
    }

    gl_FragColor = color;
}