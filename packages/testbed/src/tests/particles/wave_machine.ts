/*
 * Copyright (c) 2006-2012 Erin Catto http://www.box2d.org
 *
 * This software is provided 'as-is', without any express or implied
 * warranty.  In no event will the authors be held liable for any damages
 * arising from the use of this software.
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 * 1. The origin of this software must not be misrepresented; you must not
 * claim that you wrote the original software. If you use this software
 * in a product, an acknowledgment in the product documentation would be
 * appreciated but is not required.
 * 2. Altered source versions must be plainly marked as such, and must not be
 * misrepresented as being the original software.
 * 3. This notice may not be removed or altered from any source distribution.
 */

import { b2RevoluteJoint, b2BodyType, b2PolygonShape, b2Vec2, b2RevoluteJointDef, XY } from "@plane2d/core";
import { b2ParticleGroupDef, b2ParticleFlag } from "@plane2d/particles";

import { Test } from "../../test";
import { Settings } from "../../settings";

export class WaveMachine extends Test {
    public m_joint: b2RevoluteJoint;

    public m_time = 0;

    constructor() {
        super();

        const ground = this.m_world.CreateBody();

        {
            const body = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                allowSleep: false,
                position: { x: 0.0, y: 1.0 },
            });

            const shape = new b2PolygonShape();
            shape.SetAsBox(0.05, 1.0, new b2Vec2(2.0, 0.0), 0.0);
            body.CreateFixture(shape, 5.0);
            shape.SetAsBox(0.05, 1.0, new b2Vec2(-2.0, 0.0), 0.0);
            body.CreateFixture(shape, 5.0);
            shape.SetAsBox(2.0, 0.05, new b2Vec2(0.0, 1.0), 0.0);
            body.CreateFixture(shape, 5.0);
            shape.SetAsBox(2.0, 0.05, new b2Vec2(0.0, -1.0), 0.0);
            body.CreateFixture(shape, 5.0);

            const jd = new b2RevoluteJointDef();
            jd.bodyA = ground;
            jd.bodyB = body;
            jd.localAnchorA.Set(0.0, 1.0);
            jd.localAnchorB.Set(0.0, 0.0);
            jd.referenceAngle = 0.0;
            jd.motorSpeed = 0.05 * Math.PI;
            jd.maxMotorTorque = 1e7;
            jd.enableMotor = true;
            this.m_joint = this.m_world.CreateJoint(jd);
        }

        this.m_particleSystem.SetRadius(0.025 * 2); // HACK: increase particle radius
        const particleType = Test.GetParticleParameterValue();
        this.m_particleSystem.SetDamping(0.2);

        {
            const pd = new b2ParticleGroupDef();
            pd.flags = particleType;

            const shape = new b2PolygonShape();
            shape.SetAsBox(0.9, 0.9, new b2Vec2(0.0, 1.0), 0.0);

            pd.shape = shape;
            const group = this.m_particleSystem.CreateParticleGroup(pd);
            if (pd.flags & b2ParticleFlag.b2_colorMixingParticle) {
                this.ColorParticleGroup(group, 0);
            }
        }

        this.m_time = 0;
    }

    public Step(settings: Settings, timeStep: number) {
        super.Step(settings, timeStep);
        if (settings.m_hertz > 0) {
            this.m_time += 1 / settings.m_hertz;
        }
        this.m_joint.SetMotorSpeed(0.05 * Math.cos(this.m_time) * Math.PI);
    }

    public GetDefaultViewZoom() {
        return 250;
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 1,
        };
    }
}
