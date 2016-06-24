uniform vec2 u_resolution;

uniform vec3 u_camera_position;
uniform vec3 u_camera_look_at;
uniform vec3 u_camera_up;

uniform vec3 u_ambiant_light;
uniform vec3 u_background_color;

uniform vec3 u_point_lights_position[@var(num_point_lights)];
uniform vec3 u_point_lights_color[@var(num_point_lights)];

const float float_epsilon = 0.0001;
const int maxSteps = 128;

@import(shaders/lib/transformations.glsl)
@import(shaders/lib/primitives.glsl)

float distanceField(vec3 p) {
    float sphere = spherePrimitive(p, 1.0);
    float ground = boxPrimitive(p, vec3(0.7));

    return transformUnion(sphere, ground);
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

    // Return Diffuse + Ambiant Contributions
    return u_ambiant_light + diffuseContribution;
}

void main() {
    vec3 cameraOrigin = u_camera_position;
    vec3 cameraTarget = u_camera_look_at;
    vec3 upDirection = u_camera_up;

    vec3 cameraDir = normalize(cameraTarget - cameraOrigin);
    vec3 cameraRight = normalize(cross(upDirection, cameraOrigin));
    vec3 cameraUp = cross(cameraDir, cameraRight);

    vec2 screenPos = 1.0 - 2.0 * gl_FragCoord.xy / u_resolution.xy;
    screenPos.x *= u_resolution.x / u_resolution.y;

    vec3 rayDir = normalize(cameraRight * screenPos.x + cameraUp * screenPos.y + cameraDir);

    vec3 color = u_background_color;

    float total_dist = 0.0;
    
    vec3 p = cameraOrigin;

    for(int i = 0; i < maxSteps; ++i) {
        
        float d = distanceField(p);

        if(d < float_epsilon) {
            color = calcLightEquation(p);
            break;
        }

        total_dist += d;
        p += d * rayDir;
    }

    gl_FragColor = vec4(color, 1.0);
}