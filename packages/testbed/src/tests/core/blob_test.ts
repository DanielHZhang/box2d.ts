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

import { b2EdgeShape, b2Vec2, b2AreaJointDef, b2BodyType, b2CircleShape, b2LinearStiffness, XY } from "@plane2d/core";

import { Test } from "../../test";

export class BlobTest extends Test {
    constructor() {
        super();

        const ground = this.m_world.CreateBody();

        {
            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));
            ground.CreateFixture(shape, 0.0);
            shape.SetTwoSided(new b2Vec2(-40.0, 0.0), new b2Vec2(-40.0, 25.0));
            ground.CreateFixture(shape, 0.0);
            shape.SetTwoSided(new b2Vec2(40.0, 0.0), new b2Vec2(40.0, 25.0));
            ground.CreateFixture(shape, 0.0);
        }

        {
            const ajd = new b2AreaJointDef();

            const cx = 0.0;
            const cy = 10.0;
            const rx = 5.0;
            const ry = 5.0;
            const nBodies = 20;
            const bodyRadius = 0.5;
            for (let i = 0; i < nBodies; ++i) {
                const angle = (i * 2.0 * Math.PI) / nBodies;

                const body = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    // isBullet: true,
                    fixedRotation: true,
                    position: { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) },
                });

                body.CreateFixture({
                    shape: new b2CircleShape(bodyRadius),
                    density: 1.0,
                });

                ajd.AddBody(body);
            }

            const frequencyHz = 10.0;
            const dampingRatio = 1.0;
            b2LinearStiffness(ajd, frequencyHz, dampingRatio, ajd.bodyA, ajd.bodyB);
            this.m_world.CreateJoint(ajd);
        }
    }

    public GetDefaultViewZoom() {
        return 15;
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 5,
        };
    }
}
