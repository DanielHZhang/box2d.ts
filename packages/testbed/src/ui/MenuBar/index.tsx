import React, { useEffect, useState } from "react";

import { DrawMenu } from "../menus/DrawMenu";
import "./style.scss";
import { IterationsMenu } from "../menus/IterationsMenu";
import { SettingsMenu } from "../menus/SettingsMenu";
import { MenuButton } from "./MenuButton";
import packageData from "../../../package.json";
import { TestsMenu } from "../menus/TestsMenu";
import { useManager } from "../../manager";

export const MenuBar = () => {
    const [paused, setPaused] = useState(false);
    const manager = useManager();
    useEffect(() => {
        const connection = manager.onPauseChanged.connect(setPaused);
        return () => {
            connection.disconnect();
        };
    });
    return (
        <div className="menubar">
            <TestsMenu />
            <DrawMenu />
            <IterationsMenu />
            <SettingsMenu />
            <div className="menubar--spacer" />
            <div className="menubar--title">@plane2d Testbed version {packageData.version}</div>
            <div className="menubar--spacer" />
            <MenuButton label={paused ? "Continue (p)" : "Pause (p)"} onClick={() => manager.SetPause(!paused)} />
            <MenuButton label="Single Step (o)" onClick={() => manager.SingleStep()} />
            <MenuButton label="Restart (r)" onClick={() => manager.LoadTest()} />
        </div>
    );
};
