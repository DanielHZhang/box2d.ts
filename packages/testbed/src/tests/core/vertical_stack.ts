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

import { b2Body, b2EdgeShape, b2Vec2, b2PolygonShape, b2FixtureDef, b2BodyType, b2CircleShape } from "@plane2d/core";

import { Test } from "../../test";
import { Settings } from "../../settings";
import { hotKeyPress, HotKey } from "../../utils/hotkeys";

export class VerticalStack extends Test {
    public static readonly e_columnCount = 1;

    public static readonly e_rowCount = 15;

    public m_bullet: b2Body | null = null;

    public m_bodies: b2Body[];

    public m_indices: number[];

    constructor() {
        super();

        this.m_bodies = new Array(VerticalStack.e_rowCount * VerticalStack.e_columnCount);
        this.m_indices = new Array(VerticalStack.e_rowCount * VerticalStack.e_columnCount);

        {
            const ground = this.m_world.CreateBody();

            const shape = new b2EdgeShape();
            shape.SetTwoSided(new b2Vec2(-40.0, 0.0), new b2Vec2(40.0, 0.0));
            ground.CreateFixture(shape, 0.0);

            shape.SetTwoSided(new b2Vec2(20.0, 0.0), new b2Vec2(20.0, 20.0));
            ground.CreateFixture(shape, 0.0);
        }

        const xs = [0.0, -10.0, -5.0, 5.0, 10.0];

        for (let j = 0; j < VerticalStack.e_columnCount; ++j) {
            const shape = new b2PolygonShape();
            shape.SetAsBox(0.5, 0.5);

            const fd: b2FixtureDef = {
                shape,
                density: 1.0,
                friction: 0.3,
            };

            for (let i = 0; i < VerticalStack.e_rowCount; ++i) {
                const n = j * VerticalStack.e_rowCount + i;
                // DEBUG: b2Assert(n < VerticalStack.e_rowCount * VerticalStack.e_columnCount);
                this.m_indices[n] = n;

                const x = 0.0;
                // const x = b2RandomRange(-0.02, 0.02);
                // const x = i % 2 === 0 ? -0.01 : 0.01;
                const body = this.m_world.CreateBody({
                    type: b2BodyType.b2_dynamicBody,
                    position: { x: xs[j] + x, y: 0.55 + 1.1 * i },
                    userData: this.m_indices[n],
                });

                this.m_bodies[n] = body;

                body.CreateFixture(fd);
            }
        }
    }

    getHotkeys(): HotKey[] {
        return [hotKeyPress([], ",", "Launch a bullet", () => this.LaunchBullet())];
    }

    private LaunchBullet() {
        if (this.m_bullet) {
            this.m_world.DestroyBody(this.m_bullet);
            this.m_bullet = null;
        }

        {
            const shape = new b2CircleShape();
            shape.m_radius = 0.25;

            const fd: b2FixtureDef = {
                shape,
                density: 20.0,
                restitution: 0.05,
            };

            this.m_bullet = this.m_world.CreateBody({
                type: b2BodyType.b2_dynamicBody,
                bullet: true,
                position: { x: -31.0, y: 5.0 },
            });
            this.m_bullet.CreateFixture(fd);

            this.m_bullet.SetLinearVelocity(new b2Vec2(400.0, 0.0));
        }
    }

    public Step(settings: Settings, timeStep: number): void {
        super.Step(settings, timeStep);
        // this.addDebug("Blocksolve", g_blockSolve);
        // if (this.m_stepCount === 300) {
        //     if (this.m_bullet !== null) {
        //         this.m_world.DestroyBody(this.m_bullet);
        //         this.m_bullet = null;
        //     }

        //     {
        //         const shape = new b2CircleShape();
        //         shape.m_radius = 0.25;

        //         this.m_bullet = this.m_world.CreateBody({
        //             type: b2BodyType.b2_dynamicBody,
        //             bullet: true,
        //             position: { x: -31.0, y: 5.0 },
        //         });
        //         this.m_bullet.CreateFixture({
        //             shape,
        //             density: 20.0,
        //             restitution: 0.05,
        //         });

        //         this.m_bullet.SetLinearVelocity(new b2Vec2(400.0, 0.0));
        //     }
        // }
    }
}
