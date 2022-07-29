import React from "react";
import moment from "moment";
import { DatePicker } from "@progress/kendo-react-dateinputs";

const TopCardInsert = ({
  insertTopData,
  handleInsertTopData,
  setInsertTopData,
}) => {
  const handleDateFicker = ({ value }, name) => {
    if (name === "uuu_P6ActivityName") {
      setInsertTopData((prev) => {
        return {
          ...prev,
          [name]: value,
        };
      });
    } else if (name === "key") {
      setInsertTopData((prev) => {
        return {
          ...prev,
          key: value.toUpperCase(),
        };
      });
    } else {
      setInsertTopData((prev) => {
        return {
          ...prev,
          [name]: moment(new Date(value)).format("MM-DD-YYYY"),
        };
      });
    }
  };

  return (
    <>
      <div className="blockInsertModalInsertBox">
        <div className="blockInsertModalSample">
          <div className="lockInsertModalSampleKey">{insertTopData.key}</div>
          <div className="blockInsertModalSampleTitle">
            {insertTopData.uuu_P6ActivityName}
          </div>
          <div className="blockInsertModalSampleDate">
            {insertTopData.planDate}
          </div>
          <div className="blockInsertModalSampleDateTop">
            {insertTopData.ddd_evm_plan_start.length > 0
              ? insertTopData.ddd_evm_plan_start
              : ""}
          </div>
          <div className="blockInsertModalSampleDate">
            {insertTopData.actualDate}
          </div>
          <div className="blockInsertModalSampleDateTop">
            {insertTopData.ddd_evm_actual_start.length > 0
              ? insertTopData.ddd_evm_actual_start
              : ""}
          </div>
        </div>
      </div>
      <div className="blockDataInsertBox">
        <div className="blockDataInsert">
          <div>Card Key: </div>
          <input
            type="text"
            className="blockDataInsertTitle"
            name="key"
            onChange={handleInsertTopData}
            value={insertTopData.key}
          />
        </div>
        <div className="blockDataInsert">
          <div>Card Title: </div>
          <input
            type="text"
            className="blockDataInsertTitle"
            name="uuu_P6ActivityName"
            onChange={handleInsertTopData}
            value={insertTopData.uuu_P6ActivityName}
          />
        </div>
        <div className="blockDataInsert">
          <div>Plan Date Start: </div>
          <DatePicker
            value={
              insertTopData.ddd_evm_plan_start.length > 0
                ? new Date(insertTopData.ddd_evm_plan_start)
                : ""
            }
            onChange={(e) => handleDateFicker(e, "ddd_evm_plan_start")}
          />
        </div>
        <div className="blockDataInsert">
          <div>Actual Date Start: </div>
          <DatePicker
            value={
              insertTopData.ddd_evm_actual_start.length > 0
                ? new Date(insertTopData.ddd_evm_actual_start)
                : ""
            }
            onChange={(e) => handleDateFicker(e, "ddd_evm_actual_start")}
          />
        </div>
      </div>
    </>
  );
};

export default TopCardInsert;
