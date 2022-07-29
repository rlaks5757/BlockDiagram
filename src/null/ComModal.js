import React from "react";
import moment from "moment";

const ComModal = ({
  modalComInfo,
  modalToggleCN,
  closedModal,
  changeCardStatus,
}) => {
  return (
    <div
      className={modalToggleCN ? "blockInsertModal" : "blockInsertModal close"}
    >
      <div className="blockInsertModalBackground" onClick={closedModal} />
      <div className="blockInsertModalContents">
        <div className="blockInsertModalContentsBox">
          <div className="blockInsertModalContentsTitle">
            비활성화된 Card 정보 입니다.
          </div>
          <div className="blockInsertModalBox">
            <div className="blockInsertModalTitle">
              {modalComInfo.uuu_P6ActivityName}
            </div>
            <div className="blockInsertModalDate">Plan Date</div>
            <div className="blockInsertModalDateBox">
              <div
                className="blockInsertModalDateBoxDate"
                style={{
                  backgroundColor:
                    modalComInfo.dtsDashBlockCategory === "High"
                      ? "#F8BBD0"
                      : modalComInfo.dtsDashBlockCategory === "Medium"
                      ? "#B3E5FC"
                      : "white",
                }}
              >
                <div>
                  {modalToggleCN
                    ? modalComInfo.ddd_evm_plan_start !== null
                      ? moment(modalComInfo.ddd_evm_plan_start).format(
                          "MM-DD-YYYY"
                        )
                      : null
                    : ""}
                </div>
                <div>
                  {modalToggleCN
                    ? modalComInfo.ddd_evm_plan_finish !== null
                      ? moment(modalComInfo.ddd_evm_plan_finish).format(
                          "MM-DD-YYYY"
                        )
                      : null
                    : ""}
                </div>
              </div>
              <div className="blockInsertModalDateBoxDuration">
                {modalComInfo.uuu_P6PlannedDuration}
              </div>
            </div>
            <div className="blockInsertModalDate">Actual Date</div>
            <div className="blockInsertModalDateBox">
              <div
                className="blockInsertModalDateBoxDate actual"
                style={{
                  backgroundColor:
                    modalComInfo.dtsDashBlockCategory === "High"
                      ? "#F8BBD0"
                      : modalComInfo.dtsDashBlockCategory === "Medium"
                      ? "#B3E5FC"
                      : "white",
                }}
              >
                <div>
                  {modalToggleCN
                    ? modalComInfo.ddd_evm_actual_start !== null
                      ? moment(modalComInfo.ddd_evm_actual_start).format(
                          "MM-DD-YYYY"
                        )
                      : null
                    : ""}
                </div>
                <div>
                  {modalToggleCN
                    ? modalComInfo.ddd_evm_actual_finish !== null
                      ? moment(modalComInfo.ddd_evm_actual_finish).format(
                          "MM-DD-YYYY"
                        )
                      : null
                    : ""}
                </div>
              </div>
              <div className="blockInsertModalDateBoxDuration">
                {modalComInfo.uuu_P6ActualDuration}
              </div>
            </div>
          </div>
          <div className="blockInsertModalContentsButtonBox">
            <button onClick={closedModal}>취소</button>
            <button onClick={() => changeCardStatus(modalComInfo)}>사용</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComModal;
