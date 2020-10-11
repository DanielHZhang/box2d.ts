/*
Test case for collision/jerking issue.
*/

import { b2Body, b2_pi, b2Vec2, b2ChainShape, b2FixtureDef, b2BodyDef, b2BodyType, b2PolygonShape } from "@box2d/core";

import { Test } from "../../test";
import { Settings } from "../../settings";
import { g_camera } from "../../utils/camera";
import { HotKey, hotKeyPress } from "../../utils/hotkeys";

export class Skier extends Test {
    public m_platform_width: number;

    public m_skier: b2Body;

    public m_fixed_camera: boolean;

    constructor() {
        super();

        const ground = this.m_world.CreateBody();

        const PlatformWidth = 8.0;

        /*
    First angle is from the horizontal and should be negative for a downward slope.
    Second angle is relative to the preceding slope, and should be positive, creating a kind of
    loose 'Z'-shape from the 3 edges.
    If A1 = -10, then A2 <= ~1.5 will result in the collision glitch.
    If A1 = -30, then A2 <= ~10.0 will result in the glitch.
    */
        const Angle1Degrees = -30.0;
        const Angle2Degrees = 10.0;

        /*
    The larger the value of SlopeLength, the less likely the glitch will show up.
    */
        const SlopeLength = 2.0;

        const SurfaceFriction = 0.2;

        // Convert to radians
        const Slope1Incline = (-Angle1Degrees * b2_pi) / 180.0;
        const Slope2Incline = Slope1Incline - (Angle2Degrees * b2_pi) / 180.0;
        //

        this.m_platform_width = PlatformWidth;

        // Horizontal platform
        const v1: b2Vec2 = new b2Vec2(-PlatformWidth, 0.0);
        const v2: b2Vec2 = new b2Vec2(0.0, 0.0);
        const v3: b2Vec2 = new b2Vec2(SlopeLength * Math.cos(Slope1Incline), -SlopeLength * Math.sin(Slope1Incline));
        const v4: b2Vec2 = new b2Vec2(
            v3.x + SlopeLength * Math.cos(Slope2Incline),
            v3.y - SlopeLength * Math.sin(Slope2Incline)
        );
        const v5: b2Vec2 = new b2Vec2(v4.x, v4.y - 1.0);

        const vertices: b2Vec2[] = [v5, v4, v3, v2, v1];

        const shape = new b2ChainShape();
        shape.CreateLoop(vertices);
        const fd = new b2FixtureDef();
        fd.shape = shape;
        fd.density = 0.0;
        fd.friction = SurfaceFriction;

        ground.CreateFixture(fd);

        {
            // const BodyWidth = 1.0;
            const BodyHeight = 2.5;
            const SkiLength = 3.0;

            /*
      Larger values for this seem to alleviate the issue to some extent.
      */
            const SkiThickness = 0.3;

            const SkiFriction = 0.0;
            const SkiRestitution = 0.15;

            const bd = new b2BodyDef();
            bd.type = b2BodyType.b2_dynamicBody;

            const initial_y = BodyHeight / 2 + SkiThickness;
            bd.position.Set(-this.m_platform_width / 2, initial_y);

            const skier = this.m_world.CreateBody(bd);

            const ski = new b2PolygonShape();
            const verts: b2Vec2[] = [];
            verts.push(new b2Vec2(-SkiLength / 2 - SkiThickness, -BodyHeight / 2));
            verts.push(new b2Vec2(-SkiLength / 2, -BodyHeight / 2 - SkiThickness));
            verts.push(new b2Vec2(SkiLength / 2, -BodyHeight / 2 - SkiThickness));
            verts.push(new b2Vec2(SkiLength / 2 + SkiThickness, -BodyHeight / 2));
            ski.Set(verts);

            const fd2 = new b2FixtureDef();
            fd2.density = 1.0;

            fd2.friction = SkiFriction;
            fd2.restitution = SkiRestitution;

            fd2.shape = ski;
            skier.CreateFixture(fd2);

            skier.SetLinearVelocity(new b2Vec2(0.5, 0.0));

            this.m_skier = skier;
        }

        g_camera.setPositionAndZoom(this.m_platform_width / 2.0, 0.0, 0.4);
        this.m_fixed_camera = true;
    }

    public GetDefaultViewZoom() {
        return 50;
    }

    getHotkeys(): HotKey[] {
        return [
            hotKeyPress([], "c", "Switch Camera Fixed/Tracking", () => {
                this.m_fixed_camera = !this.m_fixed_camera;
                if (this.m_fixed_camera) {
                    g_camera.setPosition(this.m_platform_width / 2.0, 0.0);
                }
            }),
        ];
    }

    public Step(settings: Settings, timeStep: number): void {
        if (!this.m_fixed_camera) {
            const pos = this.m_skier.GetPosition();
            g_camera.setPosition(pos.x, pos.y);
        }
        super.Step(settings, timeStep);
    }
}