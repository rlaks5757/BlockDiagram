import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import moment from "moment";
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import { process } from "@progress/kendo-data-query";
import axios from "axios";
import Url from "../url/fetchURL";

const KendoTable = () => {
  const params = useParams();

  const [customTableData, setCustomTableData] = useState([]);

  const [dataState, setDataState] = React.useState({
    skip: 0,
    take: 20,
    group: [
      {
        field: "Category",
      },
    ],
  });

  const [dataResult, setDataResult] = React.useState(
    process(customTableData, dataState)
  );

  const dataStateChange = (event) => {
    setDataResult(process(customTableData, event.dataState));
    setDataState(event.dataState);
  };

  const expandChange = (event) => {
    const isExpanded =
      event.dataItem.expanded === undefined
        ? event.dataItem.aggregates
        : event.dataItem.expanded;
    event.dataItem.expanded = !isExpanded;
    setDataResult({ ...dataResult });
  };

  useEffect(() => {
    const dataFetch = async () => {
      const tableDataSet = [];

      const fetchData = await axios.get(`${Url}/blockInfo/${params.id}`);

      const tableData = fetchData.data;

      tableData.com.forEach((com) => {
        if (com.status !== "Deleted") {
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
              com.dtsDashBlockCategory === "TOP"
                ? null
                : com.dtsDashBlockCategory,
            Status: com.status,
          });
        }
      });

      tableData.top.forEach((com) => {
        if (com.status !== "Deleted") {
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
        }
      });

      setCustomTableData(tableDataSet);
      setDataResult(process(tableDataSet, dataState));
    };

    dataFetch();
  }, [dataState, params.id]);

  return (
    <>
      {customTableData.length > 0 && (
        <Grid
          style={{
            height: "700px",
          }}
          sortable={true}
          filterable={true}
          groupable={true}
          reorderable={true}
          pageable={{
            buttonCount: 4,
            pageSizes: true,
          }}
          data={dataResult}
          {...dataState}
          onDataStateChange={dataStateChange}
          detail={DetailComponent}
          expandField="expanded"
          // onExpandChange={expandChange}
        >
          <GridColumn field="Category" width="150px" />
          <GridColumn field="Activity_ID" width="150px" />
          <GridColumn field="Activity_Name" width="150px" />
          <GridColumn
            field="Plan_Start_Date"
            filter="date"
            format="{0:D}"
            width="200px"
            cell={cellDateCustom}
          />
          <GridColumn
            field="Plan_Finish_Date"
            filter="date"
            format="{0:D}"
            width="200px"
            cell={cellDateCustom}
          />
          <GridColumn
            field="Plan_Duration"
            filter="numeric"
            width="125px"
            cell={cellTextAlignCenter}
          />
          <GridColumn
            field="Actual_Start_Date"
            filter="date"
            format="{0:D}"
            width="200px"
            cell={cellDateCustom}
          />
          <GridColumn
            field="Actual_Finish_Date"
            filter="date"
            format="{0:D}"
            width="200px"
            cell={cellDateCustom}
          />
          <GridColumn
            field="Actual_Duration"
            filter="numeric"
            width="125px"
            cell={cellTextAlignCenter}
          />
          <GridColumn field="Importance" width="125px" />
          <GridColumn field="Status" width="125px" />
        </Grid>
      )}
    </>
  );
};

export default KendoTable;

const DetailComponent = (props) => {
  const dataItem = props.dataItem;

  return (
    <div>
      <section
        style={{
          width: "300px",
          float: "left",
        }}
      >
        <p>
          <strong>Activity_ID:</strong> {dataItem.Activity_ID}
        </p>
        <p>
          <strong>Activity_Name:</strong> {dataItem.Activity_Name}
        </p>
        <p>
          <strong>Plan_Start_Date:</strong>{" "}
          {moment(new Date(dataItem.Plan_Start_Date)).format("MM-DD-YYYY")}
        </p>
        <p>
          <strong>Plan_Finish_Date:</strong>{" "}
          {dataItem.Plan_Finish_Date !== undefined
            ? ""
            : dataItem.Plan_Finish_Date !== ""
            ? moment(new Date(dataItem.Plan_Finish_Date)).format("MM-DD-YYYY")
            : ""}
        </p>
        <p>
          <strong>Plan_Duration:</strong> {dataItem.Plan_Duration}
        </p>
        <p>
          <strong>Actual_Start_Date:</strong>{" "}
          {dataItem.Actual_Start_Date !== ""
            ? moment(new Date(dataItem.Actual_Start_Date)).format("MM-DD-YYYY")
            : ""}
        </p>
        <p>
          <strong>Actual_Finish_Date:</strong>{" "}
          {dataItem.Plan_Finish_Date !== undefined
            ? " "
            : dataItem.Actual_Finish_Date !== ""
            ? moment(new Date(dataItem.Actual_Finish_Date)).format("MM-DD-YYYY")
            : ""}
        </p>
        <p>
          <strong>Actual_Duration:</strong> {dataItem.Actual_Duration}
        </p>
        <p>
          <strong>Importance:</strong> {dataItem.Importance}
        </p>
        <p>
          <strong>Status:</strong> {dataItem.Status}
        </p>
      </section>
      <section>
        <p>
          <strong>Relationship:</strong>
        </p>
        {dataItem.Relationship !== null && (
          <Grid
            style={{
              width: "500px",
            }}
            data={dataItem.Relationship}
          />
        )}
      </section>
    </div>
  );
};

const cellTextAlignCenter = (props) => {
  const style = {
    textAlign: "center",
  };
  const field = props.field || "";

  return <td style={style}>{props.dataItem[field]}</td>;
};

const cellDateCustom = (props) => {
  const style = {
    textAlign: "center",
  };

  const field = props.field || "";

  return (
    <td style={style}>
      {props.dataItem[field] !== "" &&
      props.dataItem[field] !== undefined &&
      props.dataItem[field] !== null
        ? moment(props.dataItem[field]).format("MM-DD-YYYY")
        : ""}
    </td>
  );
};
