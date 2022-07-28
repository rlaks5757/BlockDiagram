import React, { useRef, useState, useEffect } from "react";
import moment from "moment";

const ComCardInsert = ({
  insertData,
  handleInsertData,
  handleInsertDateData,
  diagramRef,
  comOriginalData,
  topOriginalData,
  clickDeletedCard,
}) => {
  const keyRef = useRef();
  const [checkKey, setCheckKey] = useState([]);

  useEffect(() => {
    setCheckKey(comOriginalData.concat(topOriginalData));
  }, [comOriginalData, topOriginalData]);

  const checkCardKey = (e) => {
    if (e.target.value.length !== 0) {
      const filterKey = comOriginalData
        .concat(topOriginalData)
        .filter((com) =>
          com.uuu_P6ActivityId.includes(e.target.value.toUpperCase())
        );
      setCheckKey(filterKey);
    } else {
      setCheckKey(comOriginalData.concat(topOriginalData));
    }
  };

  return (
    <div className="blockSampleComModal">
      <div className="blockSampleModalBackground" />
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
            onChange={(e) => {
              handleInsertData(e);
              checkCardKey(e);
            }}
            value={insertData.key}
            ref={keyRef}
          />
        </div>
        {/* {insertData.key.length !== 0 && ( */}
        <div className="checkList">
          {checkKey.length > 0 ? (
            checkKey.map((com, idx) => {
              return (
                <div
                  className="checkListBox"
                  key={idx}
                  onClick={() => clickDeletedCard(com)}
                >
                  <div>{com.uuu_P6ActivityId}</div>
                  <div>{com.status}</div>
                </div>
              );
            })
          ) : (
            <div className="checkListBox">
              <div>사용가능한 Card Key 입니다.</div>
            </div>
          )}
        </div>
        {/* )} */}

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
            onChange={handleInsertDateData}
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
            onChange={handleInsertDateData}
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
            onChange={handleInsertDateData}
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
            onChange={handleInsertDateData}
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
    </div>
  );
};

export default ComCardInsert;
