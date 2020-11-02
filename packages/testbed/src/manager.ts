import { b2Vec2, b2Clamp, b2Color } from "@plane2d/core";
import { createContext, useContext } from "react";
import { Signal } from "typed-signals";

import { g_camera } from "./utils/camera";
import { DebugDraw, g_debugDraw } from "./utils/draw";
import { hotKeyPress, HotKey, HotKeyMod } from "./utils/hotkeys";
import { PreloadedTextures, preloadTextures } from "./utils/gl/preload";
import { createDefaultShader } from "./utils/gl/defaultShader";
import { clearGlCanvas, initGlCanvas, resizeGlCanvas } from "./utils/gl/glUtils";
import { Settings } from "./settings";
import { Test, TestConstructor } from "./test";
import { FpsCalculator } from "./utils/FpsCalculator";
import { g_testEntriesFlat } from "./tests";
import type { TextTable, TextTableSetter } from "./ui/Main";

const modifiers: HotKeyMod[] = ["ctrl", "alt", "shift"];

function hotKeyToText(hotKey: HotKey) {
    const key = hotKey.key === " " ? "Space" : hotKey.key;
    return [...modifiers.filter((mod) => hotKey[mod]), key].join(" + ");
}

export class TestManager {
    public m_fpsCalculator = new FpsCalculator(200, 200, 16);

    public readonly m_settings: Settings = new Settings();

    public m_test: Test | null = null;

    public m_lMouseDown = false;

    public m_rMouseDown = false;

    public m_max_demo_time: number = 1000 * 10;

    public m_ctx: CanvasRenderingContext2D | null = null;

    private m_mouse = new b2Vec2();

    private readonly ownHotKeys: HotKey[];

    private testBaseHotKeys: HotKey[] = [];

    private testHotKeys: HotKey[] = [];

    private allHotKeys: HotKey[] = [];

    private testConstructor: TestConstructor | null = null;

    private testTitle = "Unset";

    public readonly onPauseChanged = new Signal<(paused: boolean) => void>();

    private m_hoveringCanvas = false;

    private m_keyMap: { [s: string]: boolean } = {};

    private gl: WebGLRenderingContext | null = null;

    private textures: PreloadedTextures | null = null;

    private defaultShader: ReturnType<typeof createDefaultShader> | null = null;

    private activateTest: (label: string) => void = () => {};

    private setLeftTable: TextTableSetter = () => {};

    private setRightTable: TextTableSetter = () => {};

    public constructor() {
        this.ownHotKeys = [
            hotKeyPress([], "0", "Reset Camera", () => this.HomeCamera()),
            hotKeyPress([], "+", "Zoom In", () => this.ZoomCamera(1.1)),
            hotKeyPress([], "-", "Zoom Out", () => this.ZoomCamera(0.9)),
            hotKeyPress([], "r", "Reload Test", () => this.LoadTest()),
            hotKeyPress([], "o", "Single Step", () => this.SingleStep()),
            hotKeyPress([], "p", "Pause/Continue", () => this.SetPause(!this.m_settings.m_pause)),
            hotKeyPress([], "PageUp", "Previous Test", () => this.DecrementTest()),
            hotKeyPress([], "PageDown", "Next Test", () => this.IncrementTest()),
            hotKeyPress(["shift"], ",", "Previous Particle Parameter", () => {
                Test.particleParameter.Decrement();
            }),
            hotKeyPress(["shift"], ".", "Next Particle Parameter", () => {
                Test.particleParameter.Increment();
            }),
        ];
    }

    public init(
        glCanvas: HTMLCanvasElement,
        debugCanvas: HTMLCanvasElement,
        wrapper: HTMLDivElement,
        activateTest: (label: string) => void,
        setLeftTables: TextTableSetter,
        setRightTables: TextTableSetter,
    ) {
        this.setLeftTable = setLeftTables;
        this.setRightTable = setRightTables;
        this.activateTest = activateTest;
        debugCanvas.addEventListener("mousedown", (e) => this.HandleMouseDown(e));
        debugCanvas.addEventListener("mouseup", (e) => this.HandleMouseUp(e));
        debugCanvas.addEventListener("mousemove", (e) => this.HandleMouseMove(e));
        debugCanvas.addEventListener("wheel", (e) => this.HandleMouseWheel(e));
        debugCanvas.addEventListener("mouseenter", () => {
            this.m_hoveringCanvas = true;
        });
        debugCanvas.addEventListener("mouseleave", () => {
            this.m_hoveringCanvas = false;
        });

        const onResize = () => {
            const { clientWidth, clientHeight } = wrapper;
            if (debugCanvas.width !== clientWidth || debugCanvas.height !== clientHeight) {
                debugCanvas.width = glCanvas.width = clientWidth;
                debugCanvas.height = glCanvas.height = clientHeight;
                g_camera.resize(clientWidth, clientHeight);
                this.m_test?.Resize(clientWidth, clientHeight);
                this.gl && resizeGlCanvas(glCanvas, this.gl, clientWidth, wrapper.clientHeight);
            }
        };
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);
        onResize();

        g_debugDraw.m_ctx = this.m_ctx = debugCanvas.getContext("2d");

        // disable context menu to use right-click
        window.addEventListener(
            "contextmenu",
            (e) => {
                if (e.target instanceof HTMLElement && e.target.closest("main")) {
                    e.preventDefault();
                }
            },
            true,
        );

        window.addEventListener("keydown", (e: KeyboardEvent): void => this.HandleKey(e, true));
        window.addEventListener("keyup", (e: KeyboardEvent): void => this.HandleKey(e, false));

        this.LoadTest();

        this.prepareGl(glCanvas);
    }

    private async prepareGl(glCanvas: HTMLCanvasElement) {
        this.gl = initGlCanvas(glCanvas);
        this.textures = await preloadTextures(this.gl);
        this.defaultShader = createDefaultShader(this.gl);
        this.LoadTest();
    }

    setTest(title: string, constructor: TestConstructor) {
        this.testTitle = title;
        this.testConstructor = constructor;
        this.LoadTest();
    }

    public HomeCamera(): void {
        const zoom = this.m_test ? this.m_test.GetDefaultViewZoom() : 25;
        const center = this.m_test ? this.m_test.getCenter() : b2Vec2.ZERO;
        g_camera.setPositionAndZoom(center.x, center.y, zoom);
    }

    public ZoomCamera(zoom: number): void {
        g_camera.setZoom(b2Clamp(g_camera.getZoom() * zoom, 0.5, 500));
    }

    public HandleMouseMove(e: MouseEvent): void {
        const element: b2Vec2 = new b2Vec2(e.offsetX, e.offsetY);
        const world: b2Vec2 = g_camera.unproject(element, new b2Vec2());

        this.m_mouse.Copy(element);

        this.m_test?.MouseMove(world, this.m_lMouseDown);

        if (this.m_rMouseDown) {
            const { x, y } = g_camera.getCenter();
            const f = 1 / g_camera.getZoom();
            g_camera.setPosition(x - e.movementX * f, y + e.movementY * f);
        }
    }

    public HandleMouseDown(e: MouseEvent): void {
        const element: b2Vec2 = new b2Vec2(e.offsetX, e.offsetY);
        const world: b2Vec2 = g_camera.unproject(element, new b2Vec2());

        switch (e.button) {
            case 0: // left mouse button
                this.m_lMouseDown = true;
                if (e.shiftKey) {
                    this.m_test?.ShiftMouseDown(world);
                } else {
                    this.m_test?.MouseDown(world);
                }
                break;
            case 2: // right mouse button
                this.m_rMouseDown = true;
                break;
        }
    }

    public HandleMouseUp(e: MouseEvent): void {
        const element: b2Vec2 = new b2Vec2(e.offsetX, e.offsetY);
        const world: b2Vec2 = g_camera.unproject(element, new b2Vec2());

        switch (e.button) {
            case 0: // left mouse button
                this.m_lMouseDown = false;
                this.m_test?.MouseUp(world);
                break;
            case 2: // right mouse button
                this.m_rMouseDown = false;
                break;
        }
    }

    public HandleMouseWheel(e: WheelEvent): void {
        if (this.m_hoveringCanvas) {
            if (e.deltaY < 0) {
                this.ZoomCamera(1.1);
            } else if (e.deltaY > 0) {
                this.ZoomCamera(1 / 1.1);
            }
            e.preventDefault();
        }
    }

    private HandleKey(e: KeyboardEvent, down: boolean): void {
        if (this.m_hoveringCanvas || !down) {
            // fixme: remember state and only call if changed
            const { key, ctrlKey, shiftKey, altKey } = e;
            const match = (hk: HotKey) =>
                hk.key === key && hk.ctrl === ctrlKey && hk.alt === altKey && hk.shift === shiftKey;
            const hotKey =
                this.ownHotKeys.find(match) ?? this.testBaseHotKeys.find(match) ?? this.testHotKeys.find(match);
            if (hotKey) {
                const wasDown = !!this.m_keyMap[key];
                if (wasDown !== down) {
                    hotKey.callback(down);
                    this.m_keyMap[key] = down;
                }
                if (this.m_hoveringCanvas) e.preventDefault();
            }
        }
    }

    public DecrementTest(): void {
        const index = g_testEntriesFlat.findIndex((e) => e[0] === this.testTitle) - 1;
        if (index < 0) {
            this.activateTest(g_testEntriesFlat[g_testEntriesFlat.length - 1][0]);
        } else if (index >= 0) {
            this.activateTest(g_testEntriesFlat[index][0]);
        }
    }

    public IncrementTest(): void {
        const index = g_testEntriesFlat.findIndex((e) => e[0] === this.testTitle) + 1;
        if (index >= g_testEntriesFlat.length) {
            this.activateTest(g_testEntriesFlat[0][0]);
        } else if (index > 0) {
            this.activateTest(g_testEntriesFlat[index][0]);
        }
    }

    public LoadTest(restartTest = false): void {
        Test.particleParameterSelectionEnabled = false;
        const TestClass = this.testConstructor;
        if (!TestClass || !this.m_ctx || !this.gl || !this.defaultShader || !this.textures) return;

        if (!restartTest) {
            Test.particleParameter.Reset();
        }

        this.m_test?.Destroy();

        this.m_test = new TestClass(this.gl, this.defaultShader, this.textures);
        this.testBaseHotKeys = this.m_test.getBaseHotkeys();
        this.testHotKeys = this.m_test.getHotkeys();
        this.allHotKeys = [...this.ownHotKeys, ...this.testBaseHotKeys, ...this.testHotKeys];
        if (!restartTest) {
            this.HomeCamera();
        }
    }

    public SetPause(pause: boolean): void {
        this.m_settings.m_pause = pause;
        this.onPauseChanged.emit(pause);
    }

    public SingleStep(): void {
        if (!this.m_settings.m_pause) {
            this.m_settings.m_pause = true;
            this.onPauseChanged.emit(true);
        }
        this.m_settings.m_singleStep = true;
    }

    public SimulationLoop(): void {
        if (this.m_fpsCalculator.addFrame() <= 0 || !this.gl || !this.defaultShader || !this.m_ctx) return;
        const ctx = this.m_ctx;

        const restartTest = [false];

        clearGlCanvas(this.gl, 0, 0, 0, 0);
        this.gl.enable(this.gl.BLEND);
        this.defaultShader.use();
        this.defaultShader.uMVMatrix.set(false, g_camera.modelView);
        this.defaultShader.uPMatrix.set(false, g_camera.projection);

        // Draw World
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.save();

        // 0,0 at center of canvas, x right, y up
        ctx.translate(0.5 * g_camera.getWidth(), 0.5 * g_camera.getHeight());
        ctx.scale(1, -1);
        // apply camera
        const zoom = g_camera.getZoom();
        ctx.scale(zoom, zoom);
        ctx.lineWidth /= zoom;
        const center = g_camera.getCenter();
        ctx.translate(-center.x, -center.y);

        this.m_test?.RunStep(this.m_settings);

        // Update the state of the particle parameter.
        Test.particleParameter.Changed(restartTest);

        ctx.restore();

        if (this.m_settings.m_drawFpsMeter) this.DrawFpsMeter(ctx);

        this.UpdateText();

        if (restartTest[0]) {
            this.LoadTest(true);
        }
    }

    private DrawFpsMeter(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(0, g_camera.getHeight());
        ctx.scale(1, -1);
        ctx.fillStyle = DebugDraw.MakeStyleString(b2Color.GREEN);
        let x = 5;
        for (const frameTime of this.m_fpsCalculator.getFrames()) {
            ctx.fillRect(x, 5, 1, frameTime);
            x++;
        }
        ctx.restore();
    }

    private UpdateText() {
        const leftTable: TextTable = [];
        const fps = this.m_fpsCalculator.getFps();
        const rightTable: TextTable = [
            ["Performance:", "-"],
            ["Avg. FPS", fps.avgFps.toFixed(1)],
            ["Max. Time in ms", fps.maxTime.toFixed(1)],
            ["Min. Time in ms", fps.minTime.toFixed(1)],
            ["", ""],
        ];
        if (this.m_test) {
            if (Test.particleParameterSelectionEnabled)
                this.m_test.addDebug("Particle Type", Test.particleParameter.GetName());

            if (this.m_test.m_textLines.length) {
                leftTable.push(
                    ["Description:", "-"],
                    ...this.m_test.m_textLines.map((t) => [t, ""] as [string, string]),
                    ["", ""],
                );
            }
            if (this.m_settings.m_drawInputHelp) {
                leftTable.push(
                    ["Mouse:", "-"],
                    ["Right Drag", "Move Camera"],
                    ["Left Drag", "Grab Objects"],
                    ["Wheel", "Zoom"],
                    ["", ""],
                );
                leftTable.push(
                    ["Keyboard:", "-"],
                    ...this.allHotKeys.map((hk) => [hotKeyToText(hk), hk.description] as [string, string]),
                    ["", ""],
                );
            }
            if (this.m_test.m_debugLines.length) {
                rightTable.push(["Debug Info:", "-"], ...this.m_test.m_debugLines, ["", ""]);
            }
            if (this.m_test.m_statisticLines.length) {
                rightTable.push(["Statistics:", "-"], ...this.m_test.m_statisticLines, ["", ""]);
            }
        }
        this.setLeftTable(leftTable);
        this.setRightTable(rightTable);
    }
}

export const ManagerContext = createContext(new TestManager());
export const useManager = () => useContext(ManagerContext);
