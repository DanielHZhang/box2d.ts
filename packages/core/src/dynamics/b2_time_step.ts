/*
 * Copyright (c) 2006-2011 Erin Catto http://www.box2d.org
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

import { b2Vec2 } from "../common/b2_math";

/// Profiling data. Times are in milliseconds.
export class b2Profile {
    public step = 0;

    public collide = 0;

    public solve = 0;

    public solveInit = 0;

    public solveVelocity = 0;

    public solvePosition = 0;

    public broadphase = 0;

    public solveTOI = 0;

    public Reset() {
        this.step = 0;
        this.collide = 0;
        this.solve = 0;
        this.solveInit = 0;
        this.solveVelocity = 0;
        this.solvePosition = 0;
        this.broadphase = 0;
        this.solveTOI = 0;
        return this;
    }
}

export interface b2StepConfig {
    velocityIterations: number;
    positionIterations: number;
    particleIterations: number;
}

/// This is an internal structure.
export class b2TimeStep {
    public dt = 0; // time step

    public inv_dt = 0; // inverse time step (0 if dt == 0).

    public dtRatio = 0; // dt * inv_dt0

    public config: b2StepConfig = {
        velocityIterations: 0,
        positionIterations: 0,
        particleIterations: 0,
    };

    public warmStarting = false;

    private constructor() {}

    public static Create() {
        return new b2TimeStep();
    }

    public Copy(step: b2TimeStep): b2TimeStep {
        this.dt = step.dt;
        this.inv_dt = step.inv_dt;
        this.dtRatio = step.dtRatio;
        this.config = {
            ...step.config,
        };
        this.warmStarting = step.warmStarting;
        return this;
    }
}

/// This is an internal structure.
export class b2Position {
    public readonly c = new b2Vec2();

    public a = 0;

    public static MakeArray(length: number): b2Position[] {
        const result = new Array<b2Position>(length);
        for (let i = 0; i < length; i++) result[i] = new b2Position();
        return result;
    }
}

/// This is an internal structure.
export class b2Velocity {
    public readonly v = new b2Vec2();

    public w = 0;

    public static MakeArray(length: number): b2Velocity[] {
        const result = new Array<b2Velocity>(length);
        for (let i = 0; i < length; i++) result[i] = new b2Velocity();
        return result;
    }
}

/// Solver Data
export class b2SolverData {
    public readonly step = b2TimeStep.Create();

    public positions!: b2Position[];

    public velocities!: b2Velocity[];
}
