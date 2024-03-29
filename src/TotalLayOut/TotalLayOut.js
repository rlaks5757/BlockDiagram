import React, { useState } from "react";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import KendoTable from "../KendoTable/KendoTable";
import BlockInsert from "../BlockInsert/BlockInsert";
import BlockView from "../BlockView/BlockView";
import SCurveChart from "../SCurveChart/SCurveChart";
import "./TotalLayOut.scss";

const TotalLayOut = () => {
  const [selected, setSelected] = useState(0);
  const handleSelect = (e) => {
    setSelected(e.selected);
  };

  return (
    <TabStrip selected={selected} onSelect={handleSelect}>
      <TabStripTab title="Flow-Diagram">
        <BlockView />
      </TabStripTab>
      <TabStripTab title="S-Curve">
        <SCurveChart />
      </TabStripTab>
      <TabStripTab title="Activity List">
        <KendoTable />
      </TabStripTab>
      {/* <TabStripTab title="Commissioning Flow-Diagram Insert">
        <BlockInsert />
      </TabStripTab> */}
    </TabStrip>
  );
};

export default TotalLayOut;
