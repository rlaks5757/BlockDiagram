import React from "react";
import moment from "moment";
import { Grid, GridColumn } from "@progress/kendo-react-grid";
import { process } from "@progress/kendo-data-query";

// import {
//   IntlProvider,
//   load,
//   LocalizationProvider,
//   loadMessages,
//   IntlService,
// } from "@progress/kendo-react-intl";

// import likelySubtags from "cldr-core/supplemental/likelySubtags.json";
// import currencyData from "cldr-core/supplemental/currencyData.json";
// import weekData from "cldr-core/supplemental/weekData.json";
// import numbers from "cldr-numbers-full/main/es/numbers.json";
// import currencies from "cldr-numbers-full/main/es/currencies.json";
// import caGregorian from "cldr-dates-full/main/es/ca-gregorian.json";
// import dateFields from "cldr-dates-full/main/es/dateFields.json";
// import timeZoneNames from "cldr-dates-full/main/es/timeZoneNames.json";
// load(
//   likelySubtags,
//   currencyData,
//   weekData,
//   numbers,
//   currencies,
//   caGregorian,
//   dateFields,
//   timeZoneNames
// );

const KendoTable = ({ customTableData }) => {
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

  return (
    <>
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
        onExpandChange={expandChange}
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
