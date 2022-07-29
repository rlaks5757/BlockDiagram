import React, { useRef, useState, useEffect } from "react";
import ComCardInsert from "../../BlockInsert/ComCardInsert/ComCardInsert";
import TopCardInsert from "../../BlockInsert/ComCardInsert/TopCardInsert";
import "./InsertBlockControl.scss";

const InsertBlockControl = ({
  insertData,
  insertTopData,
  handleInsertData,
  handleInsertDateData,
  comOriginalData,
  topOriginalData,
  clickDeletedCard,
  handleInsertTopData,
  InsertBlockData,
  insertDataToggle,
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
    <div className="insertBlockControl">
      <div className="blockInsertBox">
        <select
          name="category"
          defaultValue="Commissioning Low"
          onChange={handleInsertData}
        >
          <option value="" disabled>
            Card를 선택해주세요
          </option>
          <option>Commissioning High</option>
          <option>Commissioning Medium</option>
          <option>Commissioning Low</option>
          <option>Turn-Over Package</option>
        </select>
        {insertDataToggle ? (
          <ComCardInsert
            insertData={insertData}
            handleInsertData={handleInsertData}
            handleInsertDateData={handleInsertDateData}
            comOriginalData={comOriginalData}
            topOriginalData={topOriginalData}
            clickDeletedCard={clickDeletedCard}
          />
        ) : (
          <TopCardInsert
            insertTopData={insertTopData}
            handleInsertTopData={handleInsertTopData}
            comOriginalData={comOriginalData}
            topOriginalData={topOriginalData}
          />
        )}
        <button onClick={InsertBlockData}>Insert</button>
      </div>
    </div>
  );
};

export default InsertBlockControl;
