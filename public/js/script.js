// JavaScript source code

const meetingTime = document.getElementById('dateEnd');
const timeEnd = document.getElementById('timeEnd');
//setting current date and time of expire link
var d = new Date();
var temp1 = d.getDate();
var temp2 = d.getMonth() + 1;
var temp3 = d.getFullYear();
var hour = d.getHours();
var minutes = d.getMinutes();
temp1 = (temp1.toString().length<=1) ? '0'+temp1 : temp1;  //date if 1 then 01
temp2 = (temp2.toString().length<=1) ? '0'+temp2 : temp2;
hour = (hour.toString().length<=1) ? '0'+hour : hour;
minutes = (minutes.toString().length<=1) ? '0'+minutes : minutes;

meetingTime.value = temp3+"-"+temp2+"-"+temp1; //+"T"+hour+":"+minutes;
meetingTime.min = temp3+"-"+temp2+"-"+temp1; //+"T"+hour+":"+minutes;    //minimum from now
temp1 = parseInt(temp1)+5;
temp1 = (temp1.toString().length<=1) ? '0'+temp1 : temp1;

meetingTime.max = temp3+"-"+temp2+"-"+temp1;// +"T"+hour+":"+minutes; 

timeEnd.value = hour+":"+minutes;
minutes = parseInt(minutes);
timeEnd.min = hour+":"+minutes;  //minimum


$(document).ready(function () {
    load();
});


function load() {
    //alert("Working...");
    $("#NoOfCandidate").focus();

    $("#btnCandidate").click(function () {
        $("#showCandidate").empty();
        var NoOfCandidate = $("#NoOfCandidate").val();

        //alert("" + NoOfRec);

        if (NoOfCandidate > 0) {
            createCandidate(NoOfCandidate);
        }
    }); 

    //from below this is for voter creation 
    $("#NoOfVoters").focus();

    $("#btnVoters").click(function () {
        $("#showVoters").empty();
        var NoOfVoters = $("#NoOfVoters").val();

        //alert("" + NoOfRec);

        if (NoOfVoters > 0) {
            createVoters(NoOfVoters);
        }
    });
}

function createCandidate(NoOfCandidate) {
    var tbl = "";

    tbl = "<table class='inner-card'>"+
                "<tr>"+
                    "<th> S.No </th>"+
                    "<th>  Name </th>"+
                    "<th> Age  </th>"+
                    
                    
                "</tr>";

    for (let i = 1; i <= NoOfCandidate; i++) {
        tbl += "<tr  class='input_field'>" +
        "<td class='tdage'><label  >"+ i +"</label></td>" +

                    "<td class='tdage' >"+
                        "<input type='text' class='inner-input name' id='txtName'  name='candidatesName[]' value='' placeholder=' Name' autofocus />"+
                    "</td>"+

                    "<td class='tdage'>"+
                        "<input type='number'  class='inner-input age' id='age'   name='candidatesAge[]' value='' min='1'  placeholder='Age' />"+
                    "</td>"+

                "</tr>";
    }
    tbl += "</table>";

    $("#showCandidate").append(tbl);
}

function createVoters(NoOfVoters) {
    var tbl = "";

    tbl = "<table class='inner-card'>"+
                "<tr >"+
                    "<th <label><label>S.No</label></th>"+
                    "<th><label>Email</label></th>"+                 
                "</tr>";

    for (let i = 1; i <= NoOfVoters; i++) {
        tbl += "<tr class='input_field'>" +
                    "<td ><label  style='margin-left: 8px;'>"+ i +"</label></td>" +

                    "<td class='td'>"+
              "<input type='email' class='inner-input email'  id='txtName' name='votersGmail[]' value='' placeholder=' xyz@abc.com' autofocus />"+
                    "</td>"+

                "</tr>";
    }
    tbl += "</table>";

    $("#showVoters").append(tbl);
}