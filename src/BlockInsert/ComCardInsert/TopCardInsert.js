import React, { useRef } from "react";
import moment from "moment";

const TopCardInsert = ({ insertTopData, handleInsertTopData, diagramRef }) => {
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
        <div className="blockSampleKey">{insertTopData.key}</div>
        <div className="blockSampleTitle">
          {insertTopData.uuu_P6ActivityName}
        </div>
        <div className="blockSampleDate">{insertTopData.planDate}</div>
        <div className="blockSampleDateBox">
          <div className="blockSampleDateBoxDateTop">
            <div>
              {insertTopData.ddd_evm_plan_start.length > 0
                ? insertTopData.ddd_evm_plan_start
                : ""}
            </div>
          </div>
        </div>
        <div className="blockSampleDate">{insertTopData.actualDate}</div>
        <div className="blockSampleDateBox">
          <div className="blockSampleDateBoxDateTop">
            <div>
              {insertTopData.ddd_evm_actual_start.length > 0
                ? insertTopData.ddd_evm_actual_start
                : ""}
            </div>
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
            onChange={handleInsertTopData}
            value={insertTopData.uuu_P6ActivityName}
          />
        </div>
        <div className="blockDataInsert">
          <div>Plan Date Start: </div>
          <input
            type="date"
            name="ddd_evm_plan_start"
            onChange={handleInsertTopData}
            value={
              insertTopData.ddd_evm_plan_start.length > 0
                ? moment(new Date(insertTopData.ddd_evm_plan_start)).format(
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
            onChange={handleInsertTopData}
            value={
              insertTopData.ddd_evm_actual_start.length > 0
                ? moment(new Date(insertTopData.ddd_evm_actual_start)).format(
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

export default TopCardInsert;
