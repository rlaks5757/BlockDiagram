import React, { useEffect, useState } from "react";
import { TabStrip, TabStripTab } from "@progress/kendo-react-layout";
import * as go from "gojs";
import moment from "moment";
import KendoTable from "./KendoTable";
import BlockInsert from "./BlockInsert";
import "./TotalLayOut.scss";
import InsertBlockControl from "./InsertBlockControl/InsertBlockControl";

const TotalLayOut = () => {
  const [selected, setSelected] = useState(0);
  const handleSelect = (e) => {
    setSelected(e.selected);
  };

  const [tableData, setTableData] = useState({ com: [], top: [] });
  const [customTableData, setCustomTableData] = useState([]);

  useEffect(() => {
    const tableDataSet = [];

    tableData.com.forEach((com) => {
      tableDataSet.push({
        Category:
          com.dtsDashBlockCategory === "TOP"
            ? "Turn-Over Packages"
            : "Commissioning Activity",
        Activity_ID: com.uuu_P6ActivityId,
        Activity_Name: com.uuu_P6ActivityName,
        Plan_Start_Date:
          com.ddd_evm_plan_start !== null
            ? new Date(com.ddd_evm_plan_start)
            : "",

        Plan_Finish_Date:
          com.ddd_evm_plan_finish !== null
            ? new Date(com.ddd_evm_plan_finish)
            : "",
        Plan_Duration: com.uuu_P6PlannedDuration,
        Actual_Start_Date:
          com.ddd_evm_actual_start !== null
            ? new Date(com.ddd_evm_actual_start)
            : "",
        Actual_Finish_Date:
          com.ddd_evm_actual_finish !== null
            ? new Date(com.ddd_evm_actual_finish)
            : "",
        Actual_Duration: com.uuu_P6ActualDuration,
        Relationship:
          com._bp_lineitems !== undefined
            ? com._bp_lineitems.map((com2) => {
                return {
                  Activity_ID: com2.dtsCommActivityBPK,
                  Activity_Name: com2.uuu_P6ActivityName,
                };
              })
            : null,
        Importance:
          com.dtsDashBlockCategory === "TOP" ? null : com.dtsDashBlockCategory,
        Status: com.status,
      });
    });

    tableData.top.forEach((com) => {
      tableDataSet.push({
        Category:
          com.dtsDashBlockCategory === "TOP"
            ? "Turn-Over Packages"
            : "Commissioning Activity",
        Activity_ID: com.dtsTOPCode,
        Activity_Name: com.dtsTOPTitle,
        Plan_Start_Date: new Date(com.dtsPlanHODate),
        Plan_Finish_Date: null,
        Plan_Duration: 0,
        Actual_Start_Date:
          com.dtsActualHODate !== null ? new Date(com.dtsActualHODate) : "",
        Actual_Finish_Date: null,
        Actual_Duration: 0,
        Relationship:
          com._bp_lineitems !== undefined
            ? com._bp_lineitems.map((com2) => {
                return {
                  Activity_ID: com2.dtsCommActivityBPK,
                  Activity_Name: com2.uuu_P6ActivityName,
                };
              })
            : null,
        Importance: null,
        Status: com.status,
      });
    });

    setCustomTableData(tableDataSet);
  }, [tableData]);

  return (
    <TabStrip selected={selected} onSelect={handleSelect}>
      <TabStripTab title="Flow-Diagram">
        <BlockInsert tableData={tableData} setTableData={setTableData} />
      </TabStripTab>
      <TabStripTab title="Commissioning Activity">
        <KendoTable customTableData={customTableData} />
      </TabStripTab>
      <TabStripTab title="Turn-Over Packages">
        <div>TOP</div>
      </TabStripTab>
    </TabStrip>
  );
};

export default TotalLayOut;

const baseInsertComData = {
  key: "",
  category: "Low",
  uuu_P6ActivityName: "",
  planDate: "Plan Date",
  ddd_evm_plan_start: "",
  ddd_evm_plan_finish: "",
  uuu_P6PlannedDuration: 0,
  actualDate: "Actual Date",
  ddd_evm_actual_start: "",
  ddd_evm_actual_finish: "",
  uuu_P6ActualDuration: 0,
  record_no: "",
};

const baseInsertTopData = {
  key: "",
  category: "Top",
  uuu_P6ActivityName: "",
  planDate: "Plan Date",
  ddd_evm_plan_start: "",
  actualDate: "Actual Date",
  ddd_evm_actual_start: "",
  record_no: "",
};
