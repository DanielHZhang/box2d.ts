import { b2_maxFloat, b2_epsilon } from "../common/b2_common";
import { b2Vec2, b2Transform } from "../common/b2_math";
import { b2Manifold, b2ManifoldType } from "./b2_collision";
import { b2CircleShape } from "./b2_circle_shape";
import { b2PolygonShape } from "./b2_polygon_shape";

const b2CollideCircles_s_pA: b2Vec2 = new b2Vec2();
const b2CollideCircles_s_pB: b2Vec2 = new b2Vec2();
export function b2CollideCircles(
    manifold: b2Manifold,
    circleA: b2CircleShape,
    xfA: b2Transform,
    circleB: b2CircleShape,
    xfB: b2Transform,
): void {
    manifold.pointCount = 0;

    const pA: b2Vec2 = b2Transform.MultiplyVec2(xfA, circleA.m_p, b2CollideCircles_s_pA);
    const pB: b2Vec2 = b2Transform.MultiplyVec2(xfB, circleB.m_p, b2CollideCircles_s_pB);

    const distSqr: number = b2Vec2.DistanceSquared(pA, pB);
    const radius: number = circleA.m_radius + circleB.m_radius;
    if (distSqr > radius * radius) {
        return;
    }

    manifold.type = b2ManifoldType.e_circles;
    manifold.localPoint.Copy(circleA.m_p);
    manifold.localNormal.SetZero();
    manifold.pointCount = 1;

    manifold.points[0].localPoint.Copy(circleB.m_p);
    manifold.points[0].id.key = 0;
}

const b2CollidePolygonAndCircle_s_c: b2Vec2 = new b2Vec2();
const b2CollidePolygonAndCircle_s_cLocal: b2Vec2 = new b2Vec2();
const b2CollidePolygonAndCircle_s_faceCenter: b2Vec2 = new b2Vec2();
export function b2CollidePolygonAndCircle(
    manifold: b2Manifold,
    polygonA: b2PolygonShape,
    xfA: b2Transform,
    circleB: b2CircleShape,
    xfB: b2Transform,
): void {
    manifold.pointCount = 0;

    // Compute circle position in the frame of the polygon.
    const c: b2Vec2 = b2Transform.MultiplyVec2(xfB, circleB.m_p, b2CollidePolygonAndCircle_s_c);
    const cLocal: b2Vec2 = b2Transform.TransposeMultiplyVec2(xfA, c, b2CollidePolygonAndCircle_s_cLocal);

    // Find the min separating edge.
    let normalIndex = 0;
    let separation: number = -b2_maxFloat;
    const radius: number = polygonA.m_radius + circleB.m_radius;
    const vertexCount: number = polygonA.m_count;
    const vertices: b2Vec2[] = polygonA.m_vertices;
    const normals: b2Vec2[] = polygonA.m_normals;

    for (let i = 0; i < vertexCount; ++i) {
        const s: number = b2Vec2.Dot(normals[i], b2Vec2.Subtract(cLocal, vertices[i], b2Vec2.s_t0));

        if (s > radius) {
            // Early out.
            return;
        }

        if (s > separation) {
            separation = s;
            normalIndex = i;
        }
    }

    // Vertices that subtend the incident face.
    const vertIndex1: number = normalIndex;
    const vertIndex2: number = (vertIndex1 + 1) % vertexCount;
    const v1: b2Vec2 = vertices[vertIndex1];
    const v2: b2Vec2 = vertices[vertIndex2];

    // If the center is inside the polygon ...
    if (separation < b2_epsilon) {
        manifold.pointCount = 1;
        manifold.type = b2ManifoldType.e_faceA;
        manifold.localNormal.Copy(normals[normalIndex]);
        b2Vec2.Mid(v1, v2, manifold.localPoint);
        manifold.points[0].localPoint.Copy(circleB.m_p);
        manifold.points[0].id.key = 0;
        return;
    }

    // Compute barycentric coordinates
    const u1: number = b2Vec2.Dot(b2Vec2.Subtract(cLocal, v1, b2Vec2.s_t0), b2Vec2.Subtract(v2, v1, b2Vec2.s_t1));
    const u2: number = b2Vec2.Dot(b2Vec2.Subtract(cLocal, v2, b2Vec2.s_t0), b2Vec2.Subtract(v1, v2, b2Vec2.s_t1));
    if (u1 <= 0) {
        if (b2Vec2.DistanceSquared(cLocal, v1) > radius * radius) {
            return;
        }

        manifold.pointCount = 1;
        manifold.type = b2ManifoldType.e_faceA;
        b2Vec2.Subtract(cLocal, v1, manifold.localNormal).Normalize();
        manifold.localPoint.Copy(v1);
        manifold.points[0].localPoint.Copy(circleB.m_p);
        manifold.points[0].id.key = 0;
    } else if (u2 <= 0) {
        if (b2Vec2.DistanceSquared(cLocal, v2) > radius * radius) {
            return;
        }

        manifold.pointCount = 1;
        manifold.type = b2ManifoldType.e_faceA;
        b2Vec2.Subtract(cLocal, v2, manifold.localNormal).Normalize();
        manifold.localPoint.Copy(v2);
        manifold.points[0].localPoint.Copy(circleB.m_p);
        manifold.points[0].id.key = 0;
    } else {
        const faceCenter: b2Vec2 = b2Vec2.Mid(v1, v2, b2CollidePolygonAndCircle_s_faceCenter);
        const separation2 = b2Vec2.Dot(b2Vec2.Subtract(cLocal, faceCenter, b2Vec2.s_t1), normals[vertIndex1]);
        if (separation2 > radius) {
            return;
        }

        manifold.pointCount = 1;
        manifold.type = b2ManifoldType.e_faceA;
        manifold.localNormal.Copy(normals[vertIndex1]);
        manifold.localPoint.Copy(faceCenter);
        manifold.points[0].localPoint.Copy(circleB.m_p);
        manifold.points[0].id.key = 0;
    }
}
