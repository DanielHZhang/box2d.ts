/*
 * Copyright (c) 2011 Erin Catto http://box2d.org
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

import { b2Transform, XY } from "./b2_math";

export interface RGB {
    r: number;
    g: number;
    b: number;
}

export interface RGBA extends RGB {
    a: number;
}

/// Color for debug drawing. Each value has the range [0,1].
export class b2Color implements RGBA {
    public static readonly ZERO: Readonly<b2Color> = new b2Color(0, 0, 0, 0);

    public static readonly RED: Readonly<b2Color> = new b2Color(1, 0, 0);

    public static readonly GREEN: Readonly<b2Color> = new b2Color(0, 1, 0);

    public static readonly BLUE: Readonly<b2Color> = new b2Color(0, 0, 1);

    public static readonly WHITE: Readonly<b2Color> = new b2Color(1, 1, 1);

    public static readonly BLACK: Readonly<b2Color> = new b2Color(0, 0, 0);

    public r: number;

    public g: number;

    public b: number;

    public a: number;

    constructor(r = 0.5, g = 0.5, b = 0.5, a = 1.0) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    public Clone(): b2Color {
        return new b2Color().Copy(this);
    }

    public Copy(other: RGBA) {
        this.r = other.r;
        this.g = other.g;
        this.b = other.b;
        this.a = other.a;
        return this;
    }

    public IsEqual(color: RGBA): boolean {
        return this.r === color.r && this.g === color.g && this.b === color.b && this.a === color.a;
    }

    public IsZero(): boolean {
        return this.r === 0 && this.g === 0 && this.b === 0 && this.a === 0;
    }

    public SetByteRGB(r: number, g: number, b: number) {
        this.r = r / 0xff;
        this.g = g / 0xff;
        this.b = b / 0xff;
        return this;
    }

    public SetByteRGBA(r: number, g: number, b: number, a: number) {
        this.r = r / 0xff;
        this.g = g / 0xff;
        this.b = b / 0xff;
        this.a = a / 0xff;
        return this;
    }

    public SetRGB(r: number, g: number, b: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        return this;
    }

    public SetRGBA(r: number, g: number, b: number, a: number) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
        return this;
    }

    public Add(color: RGBA) {
        this.r += color.r;
        this.g += color.g;
        this.b += color.b;
        this.a += color.a;
        return this;
    }

    public Subtract(color: RGBA) {
        this.r -= color.r;
        this.g -= color.g;
        this.b -= color.b;
        this.a -= color.a;
        return this;
    }

    public Scale(s: number) {
        this.r *= s;
        this.g *= s;
        this.b *= s;
        this.a *= s;
        return this;
    }

    public Mix(mixColor: RGBA, strength: number): void {
        b2Color.MixColors(this, mixColor, strength);
    }

    public static Add<T extends RGBA>(colorA: RGBA, colorB: RGBA, out: T): T {
        out.r = colorA.r + colorB.r;
        out.g = colorA.g + colorB.g;
        out.b = colorA.b + colorB.b;
        out.a = colorA.a + colorB.a;
        return out;
    }

    public static Subtract<T extends RGBA>(colorA: RGBA, colorB: RGBA, out: T): T {
        out.r = colorA.r - colorB.r;
        out.g = colorA.g - colorB.g;
        out.b = colorA.b - colorB.b;
        out.a = colorA.a - colorB.a;
        return out;
    }

    public static Scale<T extends RGBA>(color: RGBA, s: number, out: T): T {
        out.r = color.r * s;
        out.g = color.g * s;
        out.b = color.b * s;
        out.a = color.a * s;
        return out;
    }

    public static MixColors(colorA: RGBA, colorB: RGBA, strength: number): void {
        const dr = strength * (colorB.r - colorA.r);
        const dg = strength * (colorB.g - colorA.g);
        const db = strength * (colorB.b - colorA.b);
        const da = strength * (colorB.a - colorA.a);
        colorA.r += dr;
        colorA.g += dg;
        colorA.b += db;
        colorA.a += da;
        colorB.r -= dr;
        colorB.g -= dg;
        colorB.b -= db;
        colorB.a -= da;
    }
}

/// Implement and register this class with a b2World to provide debug drawing of physics
/// entities in your game.
export interface b2Draw {
    PushTransform(xf: b2Transform): void;

    PopTransform(xf: b2Transform): void;

    DrawPolygon(vertices: XY[], vertexCount: number, color: RGBA): void;

    DrawSolidPolygon(vertices: XY[], vertexCount: number, color: RGBA): void;

    DrawCircle(center: XY, radius: number, color: RGBA): void;

    DrawSolidCircle(center: XY, radius: number, axis: XY, color: RGBA): void;

    DrawSegment(p1: XY, p2: XY, color: RGBA): void;

    DrawTransform(xf: b2Transform): void;

    DrawPoint(p: XY, size: number, color: RGBA): void;
}
