import React, { useRef } from "react";
import moment from "moment";

const ComCardInsert = ({ insertData, handleInsertData, diagramRef }) => {
  const keyRef = useRef();

  const checkCardKey = (e) => {
    const diagram = diagramRef.current?.getDiagram();

    const nodeDataArray = JSON.parse(diagram.model.toJson()).nodeDataArray;

    const checkKeyValue = nodeDataArray.some((com) => {
      return com.key === e.target.value;
    });

    if (checkKeyValue) {
      alert("중복된 Card Key값이 있습니다.");
      keyRef.current.focus();
      keyRef.current.value = "";
    }
  };

  return (
    <>
      <div className="blockSampleCom">
        <div className="blockSampleTitle">{insertData.uuu_P6ActivityName}</div>
        <div className="blockSampleDate">{insertData.planDate}</div>
        <div className="blockSampleDateBox">
          <div
            className="blockSampleDateBoxDate"
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
              {insertData.ddd_evm_plan_start.length > 0
                ? insertData.ddd_evm_plan_start
                : ""}
            </div>
            <div>
              {insertData.ddd_evm_plan_finish.length > 0
                ? insertData.ddd_evm_plan_finish
                : ""}
            </div>
          </div>
          <div className="blockSampleDateBoxDuration">
            {insertData.uuu_P6PlannedDuration}
          </div>
        </div>
        <div className="blockSampleDate">{insertData.actualDate}</div>
        <div className="blockSampleDateBox">
          <div
            className="blockSampleDateBoxDate actual"
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
          <div className="blockSampleDateBoxDuration">
            {insertData.uuu_P6ActualDuration}
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
            onChange={handleInsertData}
            value={insertData.key}
            onBlur={checkCardKey}
            ref={keyRef}
          />
        </div>
        <div className="blockDataInsert">
          <div>Card Title: </div>
          <input
            type="text"
            className="blockDataInsertTitle"
            name="uuu_P6ActivityName"
            onChange={handleInsertData}
            value={insertData.uuu_P6ActivityName}
          />
        </div>
        <div className="blockDataInsert">
          <div>Plan Date Start: </div>
          <input
            type="date"
            name="ddd_evm_plan_start"
            onChange={handleInsertData}
            value={
              insertData.ddd_evm_plan_start.length > 0
                ? moment(new Date(insertData.ddd_evm_plan_start)).format(
                    "YYYY-MM-DD"
                  )
                : ""
            }
          />
        </div>
        <div className="blockDataInsert">
          <div>Plan Date Finish: </div>
          <input
            type="date"
            name="ddd_evm_plan_finish"
            onChange={handleInsertData}
            value={
              insertData.ddd_evm_plan_finish.length > 0
                ? moment(new Date(insertData.ddd_evm_plan_finish)).format(
                    "YYYY-MM-DD"
                  )
                : ""
            }
          />
        </div>
        <div className="blockDataInsert">
          <div>Actual Date Start: </div>
          <input
            type="date"
            name="ddd_evm_actual_start"
            onChange={handleInsertData}
            value={
              insertData.ddd_evm_actual_start.length > 0
                ? moment(new Date(insertData.ddd_evm_actual_start)).format(
                    "YYYY-MM-DD"
                  )
                : ""
            }
          />
        </div>
        <div className="blockDataInsert">
          <div>Actual Date Finish: </div>
          <input
            type="date"
            name="ddd_evm_actual_finish"
            onChange={handleInsertData}
            value={
              insertData.ddd_evm_actual_finish.length > 0
                ? moment(new Date(insertData.ddd_evm_actual_finish)).format(
                    "YYYY-MM-DD"
                  )
                : ""
            }
          />
        </div>
      </div>
    </>
  );
};

export default ComCardInsert;
