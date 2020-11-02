/*
 * Copyright (c) 2013 Google, Inc.
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

import { b2PolygonShape, b2Vec2, b2CircleShape, b2Transform, XY } from "@plane2d/core";
import { b2ParticleGroup, b2ParticleFlag, b2ParticleGroupFlag, b2ParticleGroupDef } from "@plane2d/particles";

import { Test } from "../../test";
import { Settings } from "../../settings";
import {
    ParticleParameterValue,
    ParticleParameter,
    ParticleParameterDefinition,
} from "../../utils/particles/particle_parameter";
import { HotKey, hotKeyPress } from "../../utils/hotkeys";

export class DrawingParticles extends Test {
    /**
     * Set bit 31 to distiguish these values from particle flags.
     */
    public static readonly Parameters = {
        e_parameterBegin: 1 << 31, // Start of this parameter namespace.
        e_parameterMove: (1 << 31) | (1 << 0),
        e_parameterRigid: (1 << 31) | (1 << 1),
        e_parameterRigidBarrier: (1 << 31) | (1 << 2),
        e_parameterElasticBarrier: (1 << 31) | (1 << 3),
        e_parameterSpringBarrier: (1 << 31) | (1 << 4),
        e_parameterRepulsive: (1 << 31) | (1 << 5),
    };

    public m_lastGroup: b2ParticleGroup | null;

    public m_drawing = true;

    public m_particleFlags = 0;

    public m_groupFlags = 0;

    public m_colorIndex = 0;

    public static readonly k_paramValues = [
        new ParticleParameterValue(b2ParticleFlag.b2_zombieParticle, ParticleParameter.k_DefaultOptions, "erase"),
        new ParticleParameterValue(
            DrawingParticles.Parameters.e_parameterMove,
            ParticleParameter.k_DefaultOptions,
            "move",
        ),
        new ParticleParameterValue(
            DrawingParticles.Parameters.e_parameterRigid,
            ParticleParameter.k_DefaultOptions,
            "rigid",
        ),
        new ParticleParameterValue(
            DrawingParticles.Parameters.e_parameterRigidBarrier,
            ParticleParameter.k_DefaultOptions,
            "rigid barrier",
        ),
        new ParticleParameterValue(
            DrawingParticles.Parameters.e_parameterElasticBarrier,
            ParticleParameter.k_DefaultOptions,
            "elastic barrier",
        ),
        new ParticleParameterValue(
            DrawingParticles.Parameters.e_parameterSpringBarrier,
            ParticleParameter.k_DefaultOptions,
            "spring barrier",
        ),
        new ParticleParameterValue(
            DrawingParticles.Parameters.e_parameterRepulsive,
            ParticleParameter.k_DefaultOptions,
            "repulsive wall",
        ),
    ];

    public static readonly k_paramDef = [
        new ParticleParameterDefinition(ParticleParameter.k_particleTypes),
        new ParticleParameterDefinition(DrawingParticles.k_paramValues),
    ];

    public static readonly k_paramDefCount = DrawingParticles.k_paramDef.length;

    constructor() {
        super();

        {
            const ground = this.m_world.CreateBody();

            {
                const shape = new b2PolygonShape();
                const vertices = [new b2Vec2(-4, -2), new b2Vec2(4, -2), new b2Vec2(4, 0), new b2Vec2(-4, 0)];
                shape.Set(vertices, 4);
                ground.CreateFixture(shape, 0.0);
            }

            {
                const shape = new b2PolygonShape();
                const vertices = [new b2Vec2(-4, -2), new b2Vec2(-2, -2), new b2Vec2(-2, 6), new b2Vec2(-4, 6)];
                shape.Set(vertices, 4);
                ground.CreateFixture(shape, 0.0);
            }

            {
                const shape = new b2PolygonShape();
                const vertices = [new b2Vec2(2, -2), new b2Vec2(4, -2), new b2Vec2(4, 6), new b2Vec2(2, 6)];
                shape.Set(vertices, 4);
                ground.CreateFixture(shape, 0.0);
            }

            {
                const shape = new b2PolygonShape();
                const vertices = [new b2Vec2(-4, 4), new b2Vec2(4, 4), new b2Vec2(4, 6), new b2Vec2(-4, 6)];
                shape.Set(vertices, 4);
                ground.CreateFixture(shape, 0.0);
            }
        }

        this.m_colorIndex = 0;
        this.m_particleSystem.SetRadius(0.05 * 2);
        this.m_lastGroup = null;
        this.m_drawing = true;

        // DEBUG: b2Assert((DrawingParticles.k_paramDef[0].CalculateValueMask() & DrawingParticles.Parameters.e_parameterBegin) === 0);
        Test.SetParticleParameters(DrawingParticles.k_paramDef, DrawingParticles.k_paramDefCount);
        Test.SetRestartOnParticleParameterChange(false);

        this.m_particleFlags = Test.GetParticleParameterValue();
        this.m_groupFlags = 0;
    }

    // Determine the current particle parameter from the drawing state and
    // group flags.
    public DetermineParticleParameter() {
        if (this.m_drawing) {
            if (
                this.m_groupFlags ===
                (b2ParticleGroupFlag.b2_rigidParticleGroup | b2ParticleGroupFlag.b2_solidParticleGroup)
            ) {
                return DrawingParticles.Parameters.e_parameterRigid;
            }
            if (
                this.m_groupFlags === b2ParticleGroupFlag.b2_rigidParticleGroup &&
                this.m_particleFlags === b2ParticleFlag.b2_barrierParticle
            ) {
                return DrawingParticles.Parameters.e_parameterRigidBarrier;
            }
            if (this.m_particleFlags === (b2ParticleFlag.b2_elasticParticle | b2ParticleFlag.b2_barrierParticle)) {
                return DrawingParticles.Parameters.e_parameterElasticBarrier;
            }
            if (this.m_particleFlags === (b2ParticleFlag.b2_springParticle | b2ParticleFlag.b2_barrierParticle)) {
                return DrawingParticles.Parameters.e_parameterSpringBarrier;
            }
            if (this.m_particleFlags === (b2ParticleFlag.b2_wallParticle | b2ParticleFlag.b2_repulsiveParticle)) {
                return DrawingParticles.Parameters.e_parameterRepulsive;
            }
            return this.m_particleFlags;
        }
        return DrawingParticles.Parameters.e_parameterMove;
    }

    getHotkeys(): HotKey[] {
        const {
            b2_zombieParticle,
            b2_wallParticle,
            b2_springParticle,
            b2_elasticParticle,
            b2_viscousParticle,
            b2_powderParticle,
            b2_tensileParticle,
            b2_colorMixingParticle,
            b2_barrierParticle,
            b2_repulsiveParticle,
        } = b2ParticleFlag;

        const { b2_solidParticleGroup, b2_rigidParticleGroup } = b2ParticleGroupFlag;
        return [
            hotKeyPress([], "x", "Move", () => this.SetFlags(0, 0, false)),
            hotKeyPress([], "e", "Elastic", () => this.SetFlags(b2_elasticParticle, b2_solidParticleGroup, true)),
            hotKeyPress([], "p", "Powder", () => this.SetFlags(b2_powderParticle, 0, true)),
            hotKeyPress([], "r", "Rigid", () => this.SetFlags(0, b2_rigidParticleGroup | b2_solidParticleGroup, true)),
            hotKeyPress([], "s", "Spring", () => this.SetFlags(b2_springParticle, b2_solidParticleGroup, true)),
            hotKeyPress([], "t", "Tensile", () => this.SetFlags(b2_tensileParticle, 0, true)),
            hotKeyPress([], "v", "Viscous", () => this.SetFlags(b2_viscousParticle, 0, true)),
            hotKeyPress([], "w", "Wall", () => this.SetFlags(b2_wallParticle, b2_solidParticleGroup, true)),
            hotKeyPress([], "b", "Wall Barrier", () => this.SetFlags(b2_barrierParticle | b2_wallParticle, 0, true)),

            hotKeyPress([], "h", "Rigid Barrier", () => this.SetFlags(b2_barrierParticle, b2_rigidParticleGroup, true)),
            hotKeyPress([], "n", "Elastic Barrier", () =>
                this.SetFlags(b2_barrierParticle | b2_elasticParticle, b2_solidParticleGroup, true),
            ),
            hotKeyPress([], "m", "Spring Barrier", () =>
                this.SetFlags(b2_barrierParticle | b2_springParticle, b2_solidParticleGroup, true),
            ),
            hotKeyPress([], "f", "Repulsive Wall", () =>
                this.SetFlags(b2_wallParticle | b2_repulsiveParticle, 0, true),
            ),
            hotKeyPress([], "c", "Color Mixing", () => this.SetFlags(b2_colorMixingParticle, 0, true)),
            hotKeyPress([], "z", "Erase", () => this.SetFlags(b2_zombieParticle, 0, true)),
        ];
    }

    private SetFlags(particleFlags: b2ParticleFlag, groupFlags: b2ParticleGroupFlag, drawing: boolean) {
        this.m_drawing = drawing;
        this.m_particleFlags = particleFlags;
        this.m_groupFlags = groupFlags;
        Test.SetParticleParameterValue(this.DetermineParticleParameter());
    }

    public MouseMove(p: b2Vec2, leftDrag: boolean) {
        super.MouseMove(p, leftDrag);
        if (this.m_drawing) {
            const shape = new b2CircleShape();
            shape.m_p.Copy(p);
            shape.m_radius = 0.2;
            ///  b2Transform xf;
            ///  xf.SetIdentity();
            const xf = b2Transform.IDENTITY;

            this.m_particleSystem.DestroyParticlesInShape(shape, xf);

            const joinGroup = this.m_lastGroup && this.m_groupFlags === this.m_lastGroup.GetGroupFlags();
            if (!joinGroup) {
                this.m_colorIndex = (this.m_colorIndex + 1) % Test.k_ParticleColorsCount;
            }
            const pd = new b2ParticleGroupDef();
            pd.shape = shape;
            pd.flags = this.m_particleFlags;
            if (
                this.m_particleFlags &
                    (b2ParticleFlag.b2_wallParticle |
                        b2ParticleFlag.b2_springParticle |
                        b2ParticleFlag.b2_elasticParticle) ||
                this.m_particleFlags === (b2ParticleFlag.b2_wallParticle | b2ParticleFlag.b2_barrierParticle)
            ) {
                pd.flags |= b2ParticleFlag.b2_reactiveParticle;
            }
            pd.groupFlags = this.m_groupFlags;
            pd.color.Copy(Test.k_ParticleColors[this.m_colorIndex]);
            pd.group = this.m_lastGroup;
            this.m_lastGroup = this.m_particleSystem.CreateParticleGroup(pd);
            this.m_mouseTracing = false;
        }
    }

    public MouseUp(p: b2Vec2) {
        super.MouseUp(p);
        this.m_lastGroup = null;
    }

    public ParticleGroupDestroyed(group: b2ParticleGroup) {
        super.ParticleGroupDestroyed(group);
        if (group === this.m_lastGroup) {
            this.m_lastGroup = null;
        }
    }

    public SplitParticleGroups() {
        for (let group = this.m_particleSystem.GetParticleGroupList(); group; group = group.GetNext()) {
            if (
                group !== this.m_lastGroup &&
                group.GetGroupFlags() & b2ParticleGroupFlag.b2_rigidParticleGroup &&
                group.GetAllParticleFlags() & b2ParticleFlag.b2_zombieParticle
            ) {
                // Split a rigid particle group which may be disconnected
                // by destroying particles.
                this.m_particleSystem.SplitParticleGroup(group);
            }
        }
    }

    public Step(settings: Settings, timeStep: number) {
        const parameterValue = Test.GetParticleParameterValue();
        this.m_drawing =
            (parameterValue & DrawingParticles.Parameters.e_parameterMove) !==
            DrawingParticles.Parameters.e_parameterMove;
        if (this.m_drawing) {
            switch (parameterValue) {
                case b2ParticleFlag.b2_elasticParticle:
                case b2ParticleFlag.b2_springParticle:
                case b2ParticleFlag.b2_wallParticle:
                    this.m_particleFlags = parameterValue;
                    this.m_groupFlags = b2ParticleGroupFlag.b2_solidParticleGroup;
                    break;
                case DrawingParticles.Parameters.e_parameterRigid:
                    // b2_waterParticle is the default particle type in
                    // LiquidFun.
                    this.m_particleFlags = b2ParticleFlag.b2_waterParticle;
                    this.m_groupFlags =
                        b2ParticleGroupFlag.b2_rigidParticleGroup | b2ParticleGroupFlag.b2_solidParticleGroup;
                    break;
                case DrawingParticles.Parameters.e_parameterRigidBarrier:
                    this.m_particleFlags = b2ParticleFlag.b2_barrierParticle;
                    this.m_groupFlags = b2ParticleGroupFlag.b2_rigidParticleGroup;
                    break;
                case DrawingParticles.Parameters.e_parameterElasticBarrier:
                    this.m_particleFlags = b2ParticleFlag.b2_barrierParticle | b2ParticleFlag.b2_elasticParticle;
                    this.m_groupFlags = 0;
                    break;
                case DrawingParticles.Parameters.e_parameterSpringBarrier:
                    this.m_particleFlags = b2ParticleFlag.b2_barrierParticle | b2ParticleFlag.b2_springParticle;
                    this.m_groupFlags = 0;
                    break;
                case DrawingParticles.Parameters.e_parameterRepulsive:
                    this.m_particleFlags = b2ParticleFlag.b2_repulsiveParticle | b2ParticleFlag.b2_wallParticle;
                    this.m_groupFlags = b2ParticleGroupFlag.b2_solidParticleGroup;
                    break;
                default:
                    this.m_particleFlags = parameterValue;
                    this.m_groupFlags = 0;
                    break;
            }
        }

        if (this.m_particleSystem.GetAllParticleFlags() & b2ParticleFlag.b2_zombieParticle) {
            this.SplitParticleGroups();
        }

        super.Step(settings, timeStep);
    }

    public GetDefaultViewZoom() {
        return 250;
    }

    public getCenter(): XY {
        return {
            x: 0,
            y: 2,
        };
    }
}
