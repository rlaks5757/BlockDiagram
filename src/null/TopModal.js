import React from "react";
import moment from "moment";

const TopModal = ({
  modalTopInfo,
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
            <div className="blockSampleKey">{modalTopInfo.dtsTOPCode}</div>
            <div className="blockInsertModalTitle">
              {modalTopInfo.dtsTOPTitle}
            </div>
            <div className="blockInsertModalDate">Plan Date</div>
            <div className="blockInsertModalDateBox">
              <div className="blockInsertModalDateBoxDateTop">
                <div>
                  {modalToggleCN
                    ? modalTopInfo.dtsPlanHODate !== null
                      ? moment(modalTopInfo.dtsPlanHODate).format("MM-DD-YYYY")
                      : null
                    : ""}
                </div>
              </div>
            </div>
            <div className="blockInsertModalDate">Actual Date</div>
            <div className="blockInsertModalDateBox">
              <div className="blockInsertModalDateBoxDateTop">
                <div>
                  {modalToggleCN
                    ? modalTopInfo.dtsActualHODate !== null
                      ? moment(modalTopInfo.dtsActualHODate).format(
                          "MM-DD-YYYY"
                        )
                      : null
                    : ""}
                </div>
              </div>
            </div>
          </div>
          <div className="blockInsertModalContentsButtonBox">
            <button onClick={closedModal}>취소</button>
            <button onClick={() => changeCardStatus(modalTopInfo)}>사용</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopModal;
