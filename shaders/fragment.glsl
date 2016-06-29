
/* SHADER UNIFORMS */

uniform vec2 u_resolution;

uniform vec3 u_camera_position;
uniform vec3 u_camera_look_at;
uniform vec3 u_camera_up;

uniform vec3 u_ambiant_light;
uniform vec3 u_background_color;

uniform vec3 u_point_lights_position[@var(num_point_lights)];
uniform vec3 u_point_lights_color[@var(num_point_lights)];

uniform float u_t;



/* SHADER CONSTANTS */

const float float_epsilon = 0.0001;
const int maxSteps = 128;


/* ROTATION MATRIX HELPER */
/* Source: http://www.neilmendoza.com/glsl-rotation-about-an-arbitrary-axis/ */
mat4 rotationMatrix(vec3 axis, float angle) {
    axis = normalize(axis);
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    
    return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                0.0,                                0.0,                                0.0,                                1.0);
}


/* DISTANCE TRANSFORMATIONS */

float transformUnion( float d1, float d2 ) {
    return min(d1, d2);
}

float transformSubtraction( float d1, float d2 ) {
    return max(-d1, d2);
}

float transformIntersection( float d1, float d2 ) {
    return max(d1, d2);
}




// PRIMITIVES FUNCTIONS
// Source: http://iquilezles.org/
float spherePrimitive(vec3 p, float radius) {
    return length(p) - radius;
}

float boxPrimitive( vec3 p, vec3 b ) {
    vec3 d = abs(p) - b;
    return min(max(d.x,max(d.y,d.z)),0.0) + length(max(d,0.0));
}




/* DISTANT FIELD FUNCTION SETUP */

float inf = 999999.0;

float distanceField(vec3 p) {
    float d = boxPrimitive(p,vec3(1.0));

    float s = 1.0;
    for( int m=0; m<4; m++ ) {
        vec3 a = mod( p*s, 2.0 )-1.0;
        s *= 3.0;
        vec3 r = abs(1.0 - 3.0*abs(a));

        float da = max(r.x,r.y);
        float db = max(r.y,r.z);
        float dc = max(r.z,r.x);
        float c = (min(da,min(db,dc))-1.0)/s;

        d = max(d,c);
    }

    return d;
}





/* LIGHTING FUNCTIONS */

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

    return u_ambiant_light + diffuseContribution;
}


/* ENTRY POINT */

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