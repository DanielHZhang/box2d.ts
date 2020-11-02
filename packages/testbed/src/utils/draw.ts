/*
 * Copyright (c) 2006-2007 Erin Catto http://www.box2d.org
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

import { b2Vec2, b2Draw, b2Transform, b2Color, b2AABB, RGBA, XY, b2Clamp } from "@plane2d/core";

import { g_camera } from "./camera";

const COLOR_STRING_WORLD = new b2Color(0.5, 0.9, 0.5);

// This class implements debug drawing callbacks that are invoked
// inside b2World::Step.
export class DebugDraw implements b2Draw {
    public m_ctx: CanvasRenderingContext2D | null = null;

    public PushTransform(xf: b2Transform): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            ctx.save();
            ctx.translate(xf.p.x, xf.p.y);
            ctx.rotate(xf.q.GetAngle());
        }
    }

    public PopTransform(_xf: b2Transform): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            ctx.restore();
        }
    }

    public DrawPolygon(vertices: XY[], vertexCount: number, color: RGBA): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertexCount; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.strokeStyle = DebugDraw.MakeStyleString(color, 1);
            ctx.stroke();
        }
    }

    public DrawSolidPolygon(vertices: XY[], vertexCount: number, color: RGBA): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertexCount; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.fillStyle = DebugDraw.MakeStyleString(color, 0.5);
            ctx.fill();
            ctx.strokeStyle = DebugDraw.MakeStyleString(color, 1);
            ctx.stroke();
        }
    }

    public DrawCircle(center: XY, radius: number, color: RGBA): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, Math.PI * 2, true);
            ctx.strokeStyle = DebugDraw.MakeStyleString(color, 1);
            ctx.stroke();
        }
    }

    public DrawSolidCircle(center: XY, radius: number, axis: XY, color: RGBA): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            const cx: number = center.x;
            const cy: number = center.y;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2, true);
            ctx.moveTo(cx, cy);
            ctx.lineTo(cx + axis.x * radius, cy + axis.y * radius);
            ctx.fillStyle = DebugDraw.MakeStyleString(color, 0.5);
            ctx.fill();
            ctx.strokeStyle = DebugDraw.MakeStyleString(color, 1);
            ctx.stroke();
        }
    }

    public DrawParticles(centers: XY[], radius: number, colors: RGBA[] | null, count: number) {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            if (colors) {
                for (let i = 0; i < count; ++i) {
                    const center = centers[i];
                    const color = colors[i];
                    ctx.fillStyle = DebugDraw.MakeStyleString(color);
                    // ctx.fillRect(center.x - radius, center.y - radius, 2 * radius, 2 * radius);
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2, true);
                    ctx.fill();
                }
            } else {
                ctx.fillStyle = "rgba(255,255,255,0.5)";
                // ctx.beginPath();
                for (let i = 0; i < count; ++i) {
                    const center = centers[i];
                    // ctx.rect(center.x - radius, center.y - radius, 2 * radius, 2 * radius);
                    ctx.beginPath();
                    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2, true);
                    ctx.fill();
                }
                // ctx.fill();
            }
        }
    }

    public DrawSegment(p1: XY, p2: XY, color: RGBA): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = DebugDraw.MakeStyleString(color, 1);
            ctx.stroke();
        }
    }

    public DrawTransform(xf: b2Transform): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            this.PushTransform(xf);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(1, 0);
            ctx.strokeStyle = DebugDraw.MakeStyleString(b2Color.RED);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, 1);
            ctx.strokeStyle = DebugDraw.MakeStyleString(b2Color.GREEN);
            ctx.stroke();

            this.PopTransform(xf);
        }
    }

    public DrawPoint(p: XY, size: number, color: RGBA): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            ctx.fillStyle = DebugDraw.MakeStyleString(color);
            size /= g_camera.getZoom();
            const hsize: number = size / 2;
            ctx.fillRect(p.x - hsize, p.y - hsize, size, size);
        }
    }

    public DrawString(x: number, y: number, align: "left" | "center" | "right", message: string): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            ctx.font = "16px Open Sans";
            ctx.textAlign = align;
            ctx.fillStyle = DebugDraw.MakeStyleString(b2Color.WHITE);
            // ctx.shadowOffsetX = 3;
            // ctx.shadowOffsetY = 3;
            // ctx.shadowBlur = 2;
            // ctx.shadowColor = DebugDraw.MakeStyleString(b2Color.BLACK);
            ctx.fillText(message, x, y);
        }
    }

    private static DrawStringWorld_s_p: b2Vec2 = new b2Vec2();

    private static DrawStringWorld_s_cc: b2Vec2 = new b2Vec2();

    public DrawStringWorld(x: number, y: number, message: string): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            const p: b2Vec2 = DebugDraw.DrawStringWorld_s_p.Set(x, y);

            // world -> viewport
            const vt = g_camera.getCenter();
            b2Vec2.Subtract(p, vt, p);
            b2Vec2.Scale(g_camera.getZoom(), p, p);
            p.y *= -1;
            const cc: b2Vec2 = DebugDraw.DrawStringWorld_s_cc.Set(0.5 * ctx.canvas.width, 0.5 * ctx.canvas.height);
            b2Vec2.Add(p, cc, p);

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.font = "15px DroidSans";
            ctx.fillStyle = DebugDraw.MakeStyleString(COLOR_STRING_WORLD);
            ctx.fillText(message, p.x, p.y);
            ctx.restore();
        }
    }

    public DrawAABB(aabb: b2AABB, color: RGBA): void {
        const ctx: CanvasRenderingContext2D | null = this.m_ctx;
        if (ctx) {
            ctx.strokeStyle = DebugDraw.MakeStyleString(color);
            const { x } = aabb.lowerBound;
            const { y } = aabb.lowerBound;
            const w: number = aabb.upperBound.x - aabb.lowerBound.x;
            const h: number = aabb.upperBound.y - aabb.lowerBound.y;
            ctx.strokeRect(x, y, w, h);
        }
    }

    public static MakeStyleString(color: RGBA, a = color.a): string {
        let { r, g, b } = color;
        r = b2Clamp(r * 255, 0, 255);
        g = b2Clamp(g * 255, 0, 255);
        b = b2Clamp(b * 255, 0, 255);
        if (a < 1) {
            a = b2Clamp(a, 0, 1);
            return `rgba(${r},${g},${b},${a})`;
        }
        return `rgb(${r},${g},${b})`;
    }
}

export const g_debugDraw: DebugDraw = new DebugDraw();
