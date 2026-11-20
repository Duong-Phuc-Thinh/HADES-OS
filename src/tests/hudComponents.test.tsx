import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { HudPanel } from "../components/hud/HudPanel";
import { CircularGauge } from "../components/hud/CircularGauge";
import { StatusIndicator } from "../components/hud/StatusIndicator";
import { NeonButton } from "../components/hud/NeonButton";

describe("Futuristic HUD Component Suite", () => {
  it("renders HudPanel with title and corner brackets", () => {
    render(
      <HudPanel title="HỆ THỐNG ĐIỀU KHIỂN" subtitle="CORE TELEMETRY">
        <div>Nội dung kiểm thử HUD</div>
      </HudPanel>
    );

    expect(screen.getByText("HỆ THỐNG ĐIỀU KHIỂN")).toBeInTheDocument();
    expect(screen.getByText("CORE TELEMETRY")).toBeInTheDocument();
    expect(screen.getByText("Nội dung kiểm thử HUD")).toBeInTheDocument();
  });

  it("renders CircularGauge with accurate percentage readout", () => {
    render(
      <CircularGauge value={75} label="CPU LOAD" sublabel="Intel Core i9" />
    );

    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("CPU LOAD")).toBeInTheDocument();
    expect(screen.getByText("Intel Core i9")).toBeInTheDocument();
  });

  it("renders StatusIndicator with online state and label", () => {
    render(
      <StatusIndicator status="online" label="HỆ THỐNG HOẠT ĐỘNG" subtext="ALL SECURE" />
    );

    expect(screen.getByText("HỆ THỐNG HOẠT ĐỘNG")).toBeInTheDocument();
    expect(screen.getByText("ALL SECURE")).toBeInTheDocument();
  });

  it("renders NeonButton and triggers click callback", () => {
    const handleClick = vi.fn();
    render(
      <NeonButton variant="primary" onClick={handleClick}>
        KÍCH HOẠT LỆNH
      </NeonButton>
    );

    const button = screen.getByRole("button", { name: "KÍCH HOẠT LỆNH" });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
