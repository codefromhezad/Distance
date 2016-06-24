uniform vec2 u_resolution;
uniform float u_fov;

uniform vec3 u_ambiant_color;
uniform vec3 u_point_lights_position[@var(num_point_lights)];
uniform vec3 u_point_lights_color[@var(num_point_lights)];

const float float_epsilon = 0.0001;
const int maxSteps = 32;

@import(shaders/lib/primitives.glsl)

float distanceField(vec3 p) {
    return spherePrimitive(p, 0.6);
}

vec3 calcNormal(vec3 pos) {
    vec3 eps = vec3( 0.001, 0.0, 0.0 );
    vec3 nor = vec3(
        distanceField(pos+eps.xyy) - distanceField(pos-eps.xyy),
        distanceField(pos+eps.yxy) - distanceField(pos-eps.yxy),
        distanceField(pos+eps.yyx) - distanceField(pos-eps.yyx)
    );
    return normalize(nor);
}

vec3 calcLightEquation(vec3 fieldPos) {

    // Get Diffuse Contribution of lights
    vec3 diffuseContribution = vec3(0.0);

    for(int i = 0; i < @var(num_point_lights); i++) {
        vec3 lightPos = u_point_lights_position[i];
        vec3 lightColor = u_point_lights_color[i];

        vec3 lightVector = normalize(lightPos - fieldPos);
        vec3 normal = calcNormal(fieldPos);

        float distance = length(lightPos - fieldPos);
        float diffuse = max(dot(normal, lightVector), 0.1);
        
        diffuse = diffuse * (1.0 / (1.0 + (0.25 * distance * distance)));

        diffuseContribution = diffuseContribution + lightColor * diffuse;
    }

    return u_ambiant_color + diffuseContribution;
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

        if(d < float_epsilon) {
            color = vec4(calcLightEquation(p), 1.0);
            break;
        }

        t += d;
    }

    gl_FragColor = color;
}