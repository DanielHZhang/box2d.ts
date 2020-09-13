import * as b2 from "@box2d";
import * as testbed from "../testbed.js";
/**
 * Test behavior when particles fall on a convex ambigious Body
 * contact fixture junction.
 */
export declare class Pointy extends testbed.Test {
    m_killfieldShape: b2.PolygonShape;
    m_killfieldTransform: b2.Transform;
    constructor();
    Step(settings: testbed.Settings): void;
    static Create(): Pointy;
}
//# sourceMappingURL=pointy.d.ts.map