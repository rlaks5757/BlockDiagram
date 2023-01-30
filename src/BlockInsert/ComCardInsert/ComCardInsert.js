import React from "react";
import moment from "moment";
import { DatePicker } from "@progress/kendo-react-dateinputs";
import { Input } from "@progress/kendo-react-inputs";

const ComCardInsert = ({
  insertData,
  setInsertData,
  handleInsertData,
  comOriginalData,
}) => {
  const handleDateFicker = ({ value }, name) => {
    if (name === "ddd_evm_plan_finish") {
      if (insertData.ddd_evm_plan_start.length > 0) {
        setInsertData((prev) => {
          return {
            ...prev,
            [name]: moment(new Date(value)).format("MM-DD-YYYY"),
            uuu_P6PlannedDuration:
              moment(new Date(value)).diff(
                moment(new Date(prev.ddd_evm_plan_start)),
                "days"
              ) + 1,
          };
        });
      } else {
        alert("Plan Date 시작일을 지정하여 주시기 바랍니다.");
      }
    } else if (name === "ddd_evm_actual_finish") {
      if (insertData.ddd_evm_actual_start.length > 0) {
        setInsertData((prev) => {
          return {
            ...prev,
            [name]: moment(new Date(value)).format("MM-DD-YYYY"),
            uuu_P6ActualDuration:
              moment(new Date(value)).diff(
                moment(new Date(prev.ddd_evm_actual_start)),
                "days"
              ) + 1,
          };
        });
      } else {
        alert("Acutal Date 시작일을 지정하여 주시기 바랍니다.");
      }
    } else {
      setInsertData((prev) => {
        return {
          ...prev,
          [name]: moment(new Date(value)).format("MM-DD-YYYY"),
        };
      });
    }
  };

  const handleCheck = (e) => {
    const checkItem = comOriginalData.find(
      (com) => com.uuu_P6ActivityId === e.target.value.toUpperCase()
    );

    if (checkItem !== undefined) {
      if (checkItem.status !== "Deleted") {
        alert("이미 필드에 존재하는 Card입니다.");
        setInsertData((prev) => {
          return {
            ...prev,
            key: "",
          };
        });
      }
    }
  };

  return (
    <div className="blockInsertModalInsertBox">
      <div className="blockInsertModalSample">
        <div className="lockInsertModalSampleKey">
          {insertData.commCardNoDA}
        </div>
        <div className="blockInsertModalSampleTitle">
          {insertData.uuu_P6ActivityName}
        </div>
        <div className="blockInsertModalSampleDate">{insertData.planDate}</div>
        <div className="blockInsertModalSampleDateBox">
          <div
            className="blockInsertModalSampleBoxDate"
            style={{
              backgroundColor:
                insertData.category === "High"
                  ? "#F8BBD0"
                  : insertData.category === "Medium"
                  ? "#B3E5FC"
                  : "white",
            }}
          >
            <div>
              {insertData.ddd_evm_plan_start !== ""
                ? insertData.ddd_evm_plan_start
                : ""}
            </div>
            <div>
              {insertData.ddd_evm_plan_finish !== ""
                ? insertData.ddd_evm_plan_finish
                : ""}
            </div>
          </div>
          <div className="blockInsertModalSampleDateBoxDuration">
            {insertData.uuu_P6PlannedDuration}
          </div>
        </div>
        <div className="blockInsertModalSampleDate">
          {insertData.actualDate}
        </div>
        <div className="blockInsertModalSampleDateBox">
          <div
            className="blockInsertModalSampleBoxDate"
            style={{
              backgroundColor:
                insertData.category === "High"
                  ? "#F8BBD0"
                  : insertData.category === "Medium"
                  ? "#B3E5FC"
                  : "white",
            }}
          >
            <div>
              {insertData.ddd_evm_actual_start.length > 0
                ? insertData.ddd_evm_actual_start
                : ""}
            </div>
            <div>
              {insertData.ddd_evm_actual_finish.length > 0
                ? insertData.ddd_evm_actual_finish
                : null}
            </div>
          </div>
          <div className="blockInsertModalSampleDateBoxDuration">
            {insertData.uuu_P6ActualDuration}
          </div>
        </div>
        <div className="blockInsertModalSampleLogic">
          {insertData.commSeqLogicText}
        </div>
      </div>
      <div className="blockDataInsertBox">
        <div className="blockDataInsert">
          <div>*Card Key: </div>
          <Input
            name="key"
            onChange={(e) => {
              handleInsertData(e);
            }}
            value={insertData.key}
            onBlur={handleCheck}
          />
        </div>
        <div className="blockDateBox">
          <div
            className="blockDataInsert"
            style={{ width: "50%", marginRight: "15px" }}
          >
            <div>*Card No: </div>
            <Input
              type="number"
              name="commCardNoDA"
              onChange={(e) => {
                handleInsertData(e);
              }}
              value={insertData.commCardNoDA}
              onBlur={handleCheck}
            />
          </div>

          <div className="blockDataInsert" style={{ width: "50%" }}>
            <div>*Card Title: </div>
            <Input
              type="text"
              name="uuu_P6ActivityName"
              onChange={handleInsertData}
              value={insertData.uuu_P6ActivityName}
            />
          </div>
        </div>
        <div className="blockDateBox">
          <div className="blockDataInsert" style={{ marginRight: "15px" }}>
            <div>*Plan Date Start: </div>
            <DatePicker
              value={
                insertData.ddd_evm_plan_start !== ""
                  ? new Date(insertData.ddd_evm_plan_start)
                  : ""
              }
              onChange={(e) => handleDateFicker(e, "ddd_evm_plan_start")}
            />
          </div>
          <div className="blockDataInsert">
            <div>*Plan Date Finish: </div>
            <DatePicker
              value={
                insertData.ddd_evm_plan_finish !== ""
                  ? new Date(insertData.ddd_evm_plan_finish)
                  : ""
              }
              onChange={(e) => handleDateFicker(e, "ddd_evm_plan_finish")}
            />
          </div>
        </div>
        <div className="blockDateBox">
          <div className="blockDataInsert" style={{ marginRight: "15px" }}>
            <div>Actual Date Start: </div>
            <DatePicker
              value={
                insertData.ddd_evm_actual_start !== ""
                  ? new Date(insertData.ddd_evm_actual_start)
                  : ""
              }
              onChange={(e) => handleDateFicker(e, "ddd_evm_actual_start")}
            />
          </div>
          <div className="blockDataInsert">
            <div>Actual Date Finish: </div>
            <DatePicker
              value={
                insertData.ddd_evm_actual_finish !== ""
                  ? new Date(insertData.ddd_evm_actual_finish)
                  : ""
              }
              onChange={(e) => handleDateFicker(e, "ddd_evm_actual_finish")}
            />
          </div>
        </div>
        <div className="blockDataInsert">
          <div>*Card SeqLogic: </div>
          <Input
            type="text"
            name="commSeqLogicText"
            onChange={handleInsertData}
            value={insertData.commSeqLogicText}
          />
        </div>
      </div>
    </div>
  );
};

export default ComCardInsert;
