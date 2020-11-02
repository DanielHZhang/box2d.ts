import {
    b2DestructionListener,
    b2Joint,
    b2Fixture,
    b2Vec2,
    b2PointState,
    b2Transform,
    b2ContactListener,
    b2World,
    b2Body,
    b2MouseJoint,
    b2Profile,
    b2Contact,
    b2WorldManifold,
    b2Manifold,
    b2GetPointStates,
    b2ContactImpulse,
    b2BodyType,
    b2MouseJointDef,
    b2RandomRange,
    b2CircleShape,
    b2AABB,
    b2Color,
    DrawShapes,
    DrawJoints,
    DrawAABBs,
    DrawCenterOfMasses,
    XY,
} from "@plane2d/core";
import { b2ParticleGroup, b2ParticleSystem, b2ParticleSystemDef, DrawParticleSystems } from "@plane2d/particles";
import { DrawControllers } from "@plane2d/controllers";

import { Settings } from "./settings";
import { g_debugDraw } from "./utils/draw";
import {
    ParticleParameter,
    ParticleParameterValue,
    ParticleParameterDefinition,
} from "./utils/particles/particle_parameter";
import { hotKeyPress, HotKey } from "./utils/hotkeys";
import { DefaultShader } from "./utils/gl/defaultShader";
import { PreloadedTextures } from "./utils/gl/preload";

export function RandomFloat(lo = -1, hi = 1) {
    let r = Math.random();
    r = (hi - lo) * r + lo;
    return r;
}

export interface TestConstructor {
    new (gl: WebGLRenderingContext, shader: DefaultShader, textures: PreloadedTextures): Test;
}

export type TestEntry = [string, TestConstructor];

export class DestructionListener extends b2DestructionListener {
    public test: Test;

    constructor(test: Test) {
        super();

        this.test = test;
    }

    public SayGoodbyeJoint(joint: b2Joint): void {
        if (this.test.m_mouseJoint === joint) {
            this.test.m_mouseJoint = null;
        } else {
            this.test.JointDestroyed(joint);
        }
    }

    public SayGoodbyeFixture(_fixture: b2Fixture): void {}

    public SayGoodbyeParticleGroup(group: b2ParticleGroup) {
        this.test.ParticleGroupDestroyed(group);
    }
}

export class ContactPoint {
    public fixtureA!: b2Fixture;

    public fixtureB!: b2Fixture;

    public readonly normal: b2Vec2 = new b2Vec2();

    public readonly position: b2Vec2 = new b2Vec2();

    public state: b2PointState = b2PointState.b2_nullState;

    public normalImpulse = 0;

    public tangentImpulse = 0;

    public separation = 0;
}

const formatValueAveMax = (step: number, ave: number, max: number) =>
    `${step.toFixed(2)} [${ave.toFixed(2)}] (${max.toFixed(2)})`;

export class Test extends b2ContactListener {
    public static particleParameterSelectionEnabled: boolean;

    public static readonly particleParameter = new ParticleParameter();

    public static readonly k_maxContactPoints: number = 2048;

    public m_world: b2World;

    public m_particleSystem: b2ParticleSystem;

    public m_bomb: b2Body | null = null;

    public readonly m_textLines: string[] = [];

    public readonly m_debugLines: Array<[string, string]> = [];

    public readonly m_statisticLines: Array<[string, string]> = [];

    public m_mouseJoint: b2MouseJoint | null = null;

    public readonly m_points: ContactPoint[] = Array.from(
        { length: Test.k_maxContactPoints },
        () => new ContactPoint(),
    );

    public m_pointCount = 0;

    public m_destructionListener: DestructionListener;

    public readonly m_bombSpawnPoint: b2Vec2 = new b2Vec2();

    public m_bombSpawning = false;

    public readonly m_mouseWorld: b2Vec2 = new b2Vec2();

    public m_mouseTracing = false;

    public readonly m_mouseTracerPosition: b2Vec2 = new b2Vec2();

    public readonly m_mouseTracerVelocity: b2Vec2 = new b2Vec2();

    public m_stepCount = 0;

    public readonly m_maxProfile: b2Profile = new b2Profile();

    public readonly m_totalProfile: b2Profile = new b2Profile();

    public m_groundBody: b2Body;

    public m_particleParameters: ParticleParameterValue[] | null = null;

    public m_particleParameterDef: ParticleParameterDefinition | null = null;

    constructor(gravity: XY = { x: 0, y: -10 }) {
        super();

        const particleSystemDef = new b2ParticleSystemDef();

        this.m_world = b2World.Create(gravity);

        this.m_particleSystem = this.m_world.CreateParticleSystem(particleSystemDef);

        this.m_destructionListener = new DestructionListener(this);
        this.m_world.SetDestructionListener(this.m_destructionListener);
        this.m_world.SetContactListener(this);

        this.m_particleSystem.SetGravityScale(0.4);
        this.m_particleSystem.SetDensity(1.2);

        this.m_groundBody = this.m_world.CreateBody();
    }

    getBaseHotkeys(): HotKey[] {
        return [
            hotKeyPress([], " ", "Launch Bomb", () => {
                this.LaunchBomb();
            }),
        ];
    }

    getHotkeys(): HotKey[] {
        return [];
    }

    public JointDestroyed(_joint: b2Joint): void {}

    public ParticleGroupDestroyed(_group: b2ParticleGroup) {}

    public BeginContact(_contact: b2Contact): void {}

    public EndContact(_contact: b2Contact): void {}

    private static PreSolve_s_state1: b2PointState[] = [
        /* b2_maxManifoldPoints */
    ];

    private static PreSolve_s_state2: b2PointState[] = [
        /* b2_maxManifoldPoints */
    ];

    private static PreSolve_s_worldManifold: b2WorldManifold = new b2WorldManifold();

    public PreSolve(contact: b2Contact, oldManifold: b2Manifold): void {
        const manifold: b2Manifold = contact.GetManifold();

        if (manifold.pointCount === 0) {
            return;
        }

        const fixtureA: b2Fixture | null = contact.GetFixtureA();
        const fixtureB: b2Fixture | null = contact.GetFixtureB();

        const state1: b2PointState[] = Test.PreSolve_s_state1;
        const state2: b2PointState[] = Test.PreSolve_s_state2;
        b2GetPointStates(state1, state2, oldManifold, manifold);

        const worldManifold: b2WorldManifold = Test.PreSolve_s_worldManifold;
        contact.GetWorldManifold(worldManifold);

        for (let i = 0; i < manifold.pointCount && this.m_pointCount < Test.k_maxContactPoints; ++i) {
            const cp: ContactPoint = this.m_points[this.m_pointCount];
            cp.fixtureA = fixtureA;
            cp.fixtureB = fixtureB;
            cp.position.Copy(worldManifold.points[i]);
            cp.normal.Copy(worldManifold.normal);
            cp.state = state2[i];
            cp.normalImpulse = manifold.points[i].normalImpulse;
            cp.tangentImpulse = manifold.points[i].tangentImpulse;
            cp.separation = worldManifold.separations[i];
            ++this.m_pointCount;
        }
    }

    public PostSolve(_contact: b2Contact, _impulse: b2ContactImpulse): void {}

    public MouseDown(p: b2Vec2): void {
        this.m_mouseWorld.Copy(p);

        this.m_mouseTracing = true;
        this.m_mouseTracerPosition.Copy(p);
        this.m_mouseTracerVelocity.SetZero();

        if (this.m_mouseJoint !== null) {
            this.m_world.DestroyJoint(this.m_mouseJoint);
            this.m_mouseJoint = null;
        }

        let hit_fixture: b2Fixture | null | any = null; // HACK: tsc doesn't detect calling callbacks

        // Query the world for overlapping shapes.
        this.m_world.QueryPointAABB(p, (fixture) => {
            const body = fixture.GetBody();
            if (body.GetType() === b2BodyType.b2_dynamicBody) {
                const inside = fixture.TestPoint(p);
                if (inside) {
                    hit_fixture = fixture;
                    return false; // We are done, terminate the query.
                }
            }
            return true; // Continue the query.
        });

        if (hit_fixture) {
            const body = hit_fixture.GetBody();
            const md: b2MouseJointDef = new b2MouseJointDef();
            md.bodyA = this.m_groundBody;
            md.bodyB = body;
            md.target.Copy(p);
            md.maxForce = 1000 * body.GetMass();
            this.m_mouseJoint = this.m_world.CreateJoint(md) as b2MouseJoint;
            body.SetAwake(true);
        }
    }

    public SpawnBomb(worldPt: b2Vec2): void {
        this.m_bombSpawnPoint.Copy(worldPt);
        this.m_bombSpawning = true;
    }

    public CompleteBombSpawn(p: b2Vec2): void {
        if (!this.m_bombSpawning) {
            return;
        }

        const multiplier = 30;
        const vel: b2Vec2 = b2Vec2.Subtract(this.m_bombSpawnPoint, p, new b2Vec2());
        vel.Scale(multiplier);
        this.LaunchBombAt(this.m_bombSpawnPoint, vel);
        this.m_bombSpawning = false;
    }

    public ShiftMouseDown(p: b2Vec2): void {
        this.m_mouseWorld.Copy(p);

        if (this.m_mouseJoint !== null) {
            return;
        }

        this.SpawnBomb(p);
    }

    public MouseUp(p: b2Vec2): void {
        this.m_mouseTracing = false;

        if (this.m_mouseJoint) {
            this.m_world.DestroyJoint(this.m_mouseJoint);
            this.m_mouseJoint = null;
        }

        if (this.m_bombSpawning) {
            this.CompleteBombSpawn(p);
        }
    }

    public MouseMove(p: b2Vec2, leftDrag: boolean): void {
        this.m_mouseWorld.Copy(p);

        if (leftDrag && this.m_mouseJoint) {
            this.m_mouseJoint.SetTarget(p);
        }
    }

    public LaunchBomb(): void {
        const p: b2Vec2 = new b2Vec2(b2RandomRange(-15, 15), 30);
        const v: b2Vec2 = b2Vec2.Scale(-5, p, new b2Vec2());
        this.LaunchBombAt(p, v);
    }

    public LaunchBombAt(position: b2Vec2, velocity: b2Vec2): void {
        if (this.m_bomb) {
            this.m_world.DestroyBody(this.m_bomb);
            this.m_bomb = null;
        }

        this.m_bomb = this.m_world.CreateBody({
            type: b2BodyType.b2_dynamicBody,
            position,
            bullet: true,
        });
        this.m_bomb.SetLinearVelocity(velocity);

        const circle: b2CircleShape = new b2CircleShape();
        circle.m_radius = 25 / this.GetDefaultViewZoom();

        // b2Vec2 minV = position - b2Vec2(0.3f,0.3f);
        // b2Vec2 maxV = position + b2Vec2(0.3f,0.3f);

        // b2AABB aabb;
        // aabb.lowerBound = minV;
        // aabb.upperBound = maxV;

        this.m_bomb.CreateFixture({
            shape: circle,
            density: 20,
            restitution: 0,
        });
    }

    public Resize(_width: number, _height: number) {}

    public RunStep(settings: Settings) {
        let timeStep = settings.m_hertz > 0 ? 1 / settings.m_hertz : 0;

        if (settings.m_pause) {
            if (settings.m_singleStep) {
                settings.m_singleStep = false;
            } else {
                timeStep = 0;
            }
        }
        this.m_debugLines.length = 0;
        this.m_statisticLines.length = 0;
        this.m_textLines.length = 0;
        if (settings.m_pause) this.addDebug("Paused", true);
        this.Step(settings, timeStep);
    }

    public addText(line: string) {
        this.m_textLines.push(line);
    }

    public addDebug(label: string, value: string | number | boolean) {
        this.m_debugLines.push([label, `${value}`]);
    }

    public addStatistic(label: string, value: string | number | boolean) {
        this.m_statisticLines.push([label, `${value}`]);
    }

    public getParticleSelectionRadius() {
        return 40 / this.GetDefaultViewZoom();
    }

    public Step(settings: Settings, timeStep: number): void {
        this.m_world.SetAllowSleeping(settings.m_enableSleep);
        this.m_world.SetWarmStarting(settings.m_enableWarmStarting);
        this.m_world.SetContinuousPhysics(settings.m_enableContinuous);
        this.m_world.SetSubStepping(settings.m_enableSubStepping);

        this.m_particleSystem.SetStrictContactCheck(settings.m_strictContacts);

        this.m_pointCount = 0;

        this.m_world.Step(timeStep, {
            velocityIterations: settings.m_velocityIterations,
            positionIterations: settings.m_positionIterations,
            particleIterations: settings.m_particleIterations,
        });

        if (settings.m_drawShapes) {
            DrawShapes(g_debugDraw, this.m_world);
        }
        if (settings.m_drawParticles) {
            DrawParticleSystems(g_debugDraw, this.m_world);
        }
        if (settings.m_drawJoints) {
            DrawJoints(g_debugDraw, this.m_world);
        }
        if (settings.m_drawAABBs) {
            DrawAABBs(g_debugDraw, this.m_world);
        }
        if (settings.m_drawCOMs) {
            DrawCenterOfMasses(g_debugDraw, this.m_world);
        }
        if (settings.m_drawControllers) {
            DrawControllers(g_debugDraw, this.m_world);
        }

        if (timeStep > 0) {
            ++this.m_stepCount;
        }

        if (settings.m_drawStats) {
            this.addStatistic("Bodies", this.m_world.GetBodyCount());
            this.addStatistic("Contacts", this.m_world.GetContactCount());
            this.addStatistic("Joints", this.m_world.GetJointCount());
            this.addStatistic("Particles", this.m_particleSystem.GetParticleCount());
            this.addStatistic("Groups", this.m_particleSystem.GetParticleGroupCount());
            this.addStatistic("Pairs", this.m_particleSystem.GetPairCount());
            this.addStatistic("Triads", this.m_particleSystem.GetTriadCount());
            this.addStatistic("Proxies", this.m_world.GetProxyCount());
            this.addStatistic("Height", this.m_world.GetTreeHeight());
            this.addStatistic("Balance", this.m_world.GetTreeBalance());
            this.addStatistic("Quality", this.m_world.GetTreeQuality().toFixed(2));
        }

        // Track maximum profile times
        {
            const p = this.m_world.GetProfile();
            this.m_maxProfile.step = Math.max(this.m_maxProfile.step, p.step);
            this.m_maxProfile.collide = Math.max(this.m_maxProfile.collide, p.collide);
            this.m_maxProfile.solve = Math.max(this.m_maxProfile.solve, p.solve);
            this.m_maxProfile.solveInit = Math.max(this.m_maxProfile.solveInit, p.solveInit);
            this.m_maxProfile.solveVelocity = Math.max(this.m_maxProfile.solveVelocity, p.solveVelocity);
            this.m_maxProfile.solvePosition = Math.max(this.m_maxProfile.solvePosition, p.solvePosition);
            this.m_maxProfile.solveTOI = Math.max(this.m_maxProfile.solveTOI, p.solveTOI);
            this.m_maxProfile.broadphase = Math.max(this.m_maxProfile.broadphase, p.broadphase);

            this.m_totalProfile.step += p.step;
            this.m_totalProfile.collide += p.collide;
            this.m_totalProfile.solve += p.solve;
            this.m_totalProfile.solveInit += p.solveInit;
            this.m_totalProfile.solveVelocity += p.solveVelocity;
            this.m_totalProfile.solvePosition += p.solvePosition;
            this.m_totalProfile.solveTOI += p.solveTOI;
            this.m_totalProfile.broadphase += p.broadphase;
        }

        if (settings.m_drawProfile) {
            const p = this.m_world.GetProfile();

            const aveProfile: b2Profile = new b2Profile();
            if (this.m_stepCount > 0) {
                const scale: number = 1 / this.m_stepCount;
                aveProfile.step = scale * this.m_totalProfile.step;
                aveProfile.collide = scale * this.m_totalProfile.collide;
                aveProfile.solve = scale * this.m_totalProfile.solve;
                aveProfile.solveInit = scale * this.m_totalProfile.solveInit;
                aveProfile.solveVelocity = scale * this.m_totalProfile.solveVelocity;
                aveProfile.solvePosition = scale * this.m_totalProfile.solvePosition;
                aveProfile.solveTOI = scale * this.m_totalProfile.solveTOI;
                aveProfile.broadphase = scale * this.m_totalProfile.broadphase;
            }

            this.addDebug("Step [ave] (max)", formatValueAveMax(p.step, aveProfile.step, this.m_maxProfile.step));
            this.addDebug(
                "Collide [ave] (max)",
                formatValueAveMax(p.collide, aveProfile.collide, this.m_maxProfile.collide),
            );
            this.addDebug("Solve [ave] (max)", formatValueAveMax(p.solve, aveProfile.solve, this.m_maxProfile.solve));
            this.addDebug(
                "Solve Init [ave] (max)",
                formatValueAveMax(p.solveInit, aveProfile.solveInit, this.m_maxProfile.solveInit),
            );
            this.addDebug(
                "Solve Velocity [ave] (max)",
                formatValueAveMax(p.solveVelocity, aveProfile.solveVelocity, this.m_maxProfile.solveVelocity),
            );
            this.addDebug(
                "Solve Position [ave] (max)",
                formatValueAveMax(p.solvePosition, aveProfile.solvePosition, this.m_maxProfile.solvePosition),
            );
            this.addDebug(
                "Solve TOI [ave] (max)",
                formatValueAveMax(p.solveTOI, aveProfile.solveTOI, this.m_maxProfile.solveTOI),
            );
            this.addDebug(
                "Broad-Phase [ave] (max)",
                formatValueAveMax(p.broadphase, aveProfile.broadphase, this.m_maxProfile.broadphase),
            );
        }

        if (this.m_mouseTracing && !this.m_mouseJoint) {
            const delay = 0.1;
            /// b2Vec2 acceleration = 2 / delay * (1 / delay * (m_mouseWorld - m_mouseTracerPosition) - m_mouseTracerVelocity);
            const acceleration = new b2Vec2();
            acceleration.x =
                (2 / delay) *
                ((1 / delay) * (this.m_mouseWorld.x - this.m_mouseTracerPosition.x) - this.m_mouseTracerVelocity.x);
            acceleration.y =
                (2 / delay) *
                ((1 / delay) * (this.m_mouseWorld.y - this.m_mouseTracerPosition.y) - this.m_mouseTracerVelocity.y);
            /// m_mouseTracerVelocity += timeStep * acceleration;
            this.m_mouseTracerVelocity.AddScaled(timeStep, acceleration);
            /// m_mouseTracerPosition += timeStep * m_mouseTracerVelocity;
            this.m_mouseTracerPosition.AddScaled(timeStep, this.m_mouseTracerVelocity);
            const shape = new b2CircleShape();
            shape.m_p.Copy(this.m_mouseTracerPosition);
            shape.m_radius = this.getParticleSelectionRadius();
            /// QueryCallback2 callback(m_particleSystem, &shape, m_mouseTracerVelocity);
            const aabb = new b2AABB();
            const xf = new b2Transform();
            xf.SetIdentity();
            shape.ComputeAABB(aabb, xf, 0);
            this.m_particleSystem.QueryAABB(aabb, (index) => {
                const p = this.m_particleSystem.GetPositionBuffer()[index];
                if (shape.TestPoint(b2Transform.IDENTITY, p)) {
                    const v = this.m_particleSystem.GetVelocityBuffer()[index];
                    v.Copy(this.m_mouseTracerVelocity);
                }
                return true;
            });
        }

        if (this.m_bombSpawning) {
            const c: b2Color = new b2Color(0, 0, 1);
            g_debugDraw.DrawPoint(this.m_bombSpawnPoint, 4, c);

            c.SetRGB(0.8, 0.8, 0.8);
            g_debugDraw.DrawSegment(this.m_mouseWorld, this.m_bombSpawnPoint, c);
        }

        if (settings.m_drawContactPoints) {
            const k_impulseScale = 0.1;
            const k_axisScale = 0.3;

            for (let i = 0; i < this.m_pointCount; ++i) {
                const point = this.m_points[i];

                if (point.state === b2PointState.b2_addState) {
                    // Add
                    g_debugDraw.DrawPoint(point.position, 10, new b2Color(0.3, 0.95, 0.3));
                } else if (point.state === b2PointState.b2_persistState) {
                    // Persist
                    g_debugDraw.DrawPoint(point.position, 5, new b2Color(0.3, 0.3, 0.95));
                }

                if (settings.m_drawContactNormals) {
                    const p1 = point.position;
                    const p2: b2Vec2 = b2Vec2.Add(
                        p1,
                        b2Vec2.Scale(k_axisScale, point.normal, b2Vec2.s_t0),
                        new b2Vec2(),
                    );
                    g_debugDraw.DrawSegment(p1, p2, new b2Color(0.9, 0.9, 0.9));
                } else if (settings.m_drawContactImpulse) {
                    const p1 = point.position;
                    const p2: b2Vec2 = b2Vec2.AddScaled(
                        p1,
                        k_impulseScale * point.normalImpulse,
                        point.normal,
                        new b2Vec2(),
                    );
                    g_debugDraw.DrawSegment(p1, p2, new b2Color(0.9, 0.9, 0.3));
                }

                if (settings.m_drawFrictionImpulse) {
                    const tangent: b2Vec2 = b2Vec2.CrossVec2One(point.normal, new b2Vec2());
                    const p1 = point.position;
                    const p2: b2Vec2 = b2Vec2.AddScaled(
                        p1,
                        k_impulseScale * point.tangentImpulse,
                        tangent,
                        new b2Vec2(),
                    );
                    g_debugDraw.DrawSegment(p1, p2, new b2Color(0.9, 0.9, 0.3));
                }
            }
        }
    }

    public GetDefaultViewZoom(): number {
        return 25;
    }

    public getCenter(): XY {
        return b2Vec2.ZERO;
    }

    public static readonly k_ParticleColors: b2Color[] = [
        new b2Color().SetByteRGBA(0xff, 0x00, 0x00, 0xff), // red
        new b2Color().SetByteRGBA(0x00, 0xff, 0x00, 0xff), // green
        new b2Color().SetByteRGBA(0x00, 0x00, 0xff, 0xff), // blue
        new b2Color().SetByteRGBA(0xff, 0x8c, 0x00, 0xff), // orange
        new b2Color().SetByteRGBA(0x00, 0xce, 0xd1, 0xff), // turquoise
        new b2Color().SetByteRGBA(0xff, 0x00, 0xff, 0xff), // magenta
        new b2Color().SetByteRGBA(0xff, 0xd7, 0x00, 0xff), // gold
        new b2Color().SetByteRGBA(0x00, 0xff, 0xff, 0xff), // cyan
    ];

    public static readonly k_ParticleColorsCount = Test.k_ParticleColors.length;

    /**
     * Apply a preset range of colors to a particle group.
     *
     * A different color out of k_ParticleColors is applied to each
     * particlesPerColor particles in the specified group.
     *
     * If particlesPerColor is 0, the particles in the group are
     * divided into k_ParticleColorsCount equal sets of colored
     * particles.
     */
    public ColorParticleGroup(group: b2ParticleGroup, particlesPerColor: number) {
        // DEBUG: b2Assert(group !== null);
        const colorBuffer = this.m_particleSystem.GetColorBuffer();
        const particleCount = group.GetParticleCount();
        const groupStart = group.GetBufferIndex();
        const groupEnd = particleCount + groupStart;
        const colorCount = Test.k_ParticleColors.length;
        if (!particlesPerColor) {
            particlesPerColor = Math.floor(particleCount / colorCount);
            if (!particlesPerColor) {
                particlesPerColor = 1;
            }
        }
        for (let i = groupStart; i < groupEnd; i++) {
            /// colorBuffer[i].Copy(Testbed.Test.k_ParticleColors[Math.floor(i / particlesPerColor) % colorCount]);
            colorBuffer[i] = Test.k_ParticleColors[Math.floor(i / particlesPerColor) % colorCount].Clone();
        }
    }

    /**
     * Remove particle parameters matching "filterMask" from the set
     * of particle parameters available for this test.
     */
    public InitializeParticleParameters(filterMask: number) {
        const defaultNumValues = ParticleParameter.k_defaultDefinition[0].numValues;
        const defaultValues = ParticleParameter.k_defaultDefinition[0].values;
        ///  m_particleParameters = new ParticleParameter::Value[defaultNumValues];
        this.m_particleParameters = [];
        // Disable selection of wall and barrier particle types.
        let numValues = 0;
        for (let i = 0; i < defaultNumValues; i++) {
            if (defaultValues[i].value & filterMask) {
                continue;
            }
            /// memcpy(&m_particleParameters[numValues], &defaultValues[i], sizeof(defaultValues[0]));
            this.m_particleParameters[numValues] = new ParticleParameterValue(defaultValues[i]);
            numValues++;
        }
        this.m_particleParameterDef = new ParticleParameterDefinition(this.m_particleParameters, numValues);
        /// m_particleParameterDef.values = m_particleParameters;
        /// m_particleParameterDef.numValues = numValues;
        Test.SetParticleParameters([this.m_particleParameterDef], 1);
    }

    /**
     * Perform destruction cleanup
     */
    public Destroy() {
        if (this.m_particleParameters) {
            Test.SetParticleParameters(ParticleParameter.k_defaultDefinition, 1);
            ///  delete [] m_particleParameters;
            this.m_particleParameters = null;
        }
    }

    /**
     * Set whether to restart the test on particle parameter
     * changes. This parameter is re-enabled when the test changes.
     */
    public static SetRestartOnParticleParameterChange(enable: boolean): void {
        Test.particleParameter.SetRestartOnChange(enable);
    }

    /**
     * Set the currently selected particle parameter value.  This
     * value must match one of the values in
     * Main::k_particleTypes or one of the values referenced by
     * particleParameterDef passed to SetParticleParameters().
     */
    public static SetParticleParameterValue(value: number): number {
        const index = Test.particleParameter.FindIndexByValue(value);
        // If the particle type isn't found, so fallback to the first entry in the
        // parameter.
        Test.particleParameter.Set(index >= 0 ? index : 0);
        return Test.particleParameter.GetValue();
    }

    /**
     * Get the currently selected particle parameter value.
     */
    public static GetParticleParameterValue(): number {
        this.particleParameterSelectionEnabled = true;
        return Test.particleParameter.GetValue();
    }

    /**
     * Override the default particle parameters for the test.
     */
    public static SetParticleParameters(
        particleParameterDef: ParticleParameterDefinition[],
        particleParameterDefCount: number = particleParameterDef.length,
    ) {
        Test.particleParameter.SetDefinition(particleParameterDef, particleParameterDefCount);
    }
}
