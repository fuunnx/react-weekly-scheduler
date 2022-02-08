/* eslint-disable @typescript-eslint/no-use-before-define */

import { addDays } from "date-fns";
import {
  CSSProperties,
  PropsWithChildren,
  useLayoutEffect,
  useRef,
  ReactNode,
  useMemo,
  MouseEventHandler
} from "react";
import useDimensions from "react-cool-dimensions";
import { CanvasSizeContext } from "./canvasSize";
import { getWeekDay } from "./libs/getWeekDay";

type QuarterPosition = {
  weekday: number;
  hour: number;
  quarter: number;
};

type TimeGridProps = {
  getQuarterStyle: (quarterPosition: QuarterPosition) => CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
};

const HOURS_AXIS_WIDTH = "3rem";
const DAYS_AXIS_HEIGHT = "4rem";
const weekOffset = 0;

export function TimeGrid(props: PropsWithChildren<TimeGridProps>) {
  const today = addDays(new Date(), weekOffset * 7);
  const firstDayOfWeek = addDays(today, -1 * getWeekDay(today));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: `${DAYS_AXIS_HEIGHT} 1fr`,
        gridTemplateColumns: `${HOURS_AXIS_WIDTH} 1fr`,
        width: "100vw",
        alignItems: "stretch"
      }}
    >
      <DaysAxis firstDayOfWeek={firstDayOfWeek} />
      <TimeAxis />
      <Canvas {...props} />
    </div>
  );
}

function Canvas(props: PropsWithChildren<TimeGridProps>) {
  const { children, getQuarterStyle, onClick } = props;

  const { observe, width, height } = useDimensions();
  const size = useMemo(() => {
    return { width, height };
  }, [width, height]);

  return (
    <CanvasSizeContext.Provider value={size}>
      <div
        onClick={onClick}
        ref={observe}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          alignItems: "stretch",
          position: "relative"
        }}
      >
        {Array.from({ length: 7 }).map((_, weekday) => {
          return (
            <Day
              key={weekday}
              getQuarterStyle={getQuarterStyle}
              weekday={weekday}
            />
          );
        })}
        {children}
      </div>
    </CanvasSizeContext.Provider>
  );
}

type DayProps = {
  weekday: number;
  getQuarterStyle: (quarterPosition: QuarterPosition) => CSSProperties;
};

function Day(props: DayProps) {
  const { weekday, getQuarterStyle } = props;
  const isCurrentDay = weekday === getWeekDay();

  const anchor = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    anchor.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <HoursGrid
      style={{
        minWidth: "10rem",
        borderRight: "1px solid black"
      }}
      renderHour={(hour) => {
        const isCurrentHour = isCurrentDay && hour === new Date().getHours();
        return (
          <>
            {Array.from({ length: 4 }).map((_, quarter) => {
              const isCurrentQuarter =
                isCurrentHour &&
                Math.floor(new Date().getMinutes() / 15) === quarter;
              return (
                <div
                  key={quarter}
                  ref={isCurrentQuarter ? anchor : null}
                  style={{
                    borderTop: "1px solid rgba(100, 100, 100, 0.25)",
                    flex: 1,
                    opacity: 0.5,
                    ...getQuarterStyle({
                      weekday,
                      hour,
                      quarter
                    }),
                    ...(isCurrentQuarter
                      ? {
                          background: "rgba(255, 0, 0, 1)",
                          zIndex: 15,
                          borderRadius: "1rem"
                        }
                      : {})
                  }}
                />
              );
            })}
          </>
        );
      }}
    />
  );
}

type DaysAxisProps = {
  firstDayOfWeek: Date;
};

function DaysAxis(props: DaysAxisProps) {
  const { firstDayOfWeek } = props;
  return (
    <div
      style={{
        position: "sticky",
        top: 1,
        display: "grid",
        gridTemplateColumns: `${HOURS_AXIS_WIDTH} repeat(7, 1fr)`,
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.1)",
        background: "white",
        zIndex: 30,
        gridColumn: "span 2"
      }}
    >
      <div></div>
      {Array.from({ length: 7 }).map((_, weekday) => (
        <h4
          key={weekday}
          style={{
            margin: 0,
            padding: "1rem",
            borderRight: "1px solid black",
            zIndex: 10,
            height: "100%",
            textAlign: "center",
            minWidth: "10rem"
          }}
        >
          {addDays(firstDayOfWeek, weekday).toDateString()}
        </h4>
      ))}
    </div>
  );
}

function TimeAxis() {
  return (
    <HoursGrid
      style={{
        position: "sticky",
        left: 0,
        background: "white",
        boxShadow: "8px 0 16px rgba(0, 0, 0, 0.1)",
        zIndex: 20
      }}
      renderHour={(hour) => {
        return (
          <label
            style={{
              lineHeight: "1rem",
              top: "-.5rem",
              position: "absolute",
              right: ".25rem"
            }}
          >
            {hour}h
          </label>
        );
      }}
    />
  );
}

type HoursGridProps = {
  renderHour: (hour: number) => ReactNode | undefined;
  style?: CSSProperties;
};

function HoursGrid(props: HoursGridProps) {
  const { renderHour, style } = props;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        ...style
      }}
    >
      {Array.from({ length: 24 }).map((_, hour) => {
        return (
          <div
            key={hour}
            style={{
              borderTop: "1px solid lightgrey",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: "4rem",
              position: "relative"
            }}
          >
            {renderHour(hour)}
          </div>
        );
      })}
    </div>
  );
}
