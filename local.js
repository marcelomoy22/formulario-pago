// var api = "https://api.aerocontaxi.com.mx/"
var api = "http://localhost:3010/"
var place;
var priceTrip = 0;
var BankTerminal;
var typePayment;
var OptypeSale;
var maxSaturation = 0;
var originalPrice = 0;
var opcion = undefined;
var originPriceTrip = 0;
var redondo = "No";
// UnitType
$(document).ready(function () {
    getMaxSaturation();
    $.get(api + "api/unitAppTypes", function (unitT) {
        unitT.forEach(function (u) {
            if (u.listInApp)
                $('#typeVehicle').append($('<option>', {
                    value: u._id,
                    text: u.name
                }));
        })
    }, "json");
  $("#divRegreso").hide();
});
// InitDateTime Picker
$(document).ready(function () {
    document.getElementById("datepicker").addEventListener("click", refresDatePicker());
    var dt = new Date();

    var datetime = getInitialTime(dt, dt.getHours(), dt.getMinutes());

    // console.log(datetime);
    // console.log(moment().add(75, 'minutes').format("YYYY/MM/DD HH:mm"))

    $("#datepicker").datetimepicker({
        format: 'yyyy-mm-dd hh:ii',
        minuteStep: 15,
        autoclose: true,
        startDate: datetime,
        todayBtn: true
    });
});
// InitDateTime Picker2
$(document).ready(function () {
    document.getElementById("datepicker2").addEventListener("click", refresDatePicker2());
    var dt = new Date();

    var datetime = getInitialTime(dt, dt.getHours(), dt.getMinutes());

    // console.log(datetime);
    // console.log(moment().add(75, 'minutes').format("YYYY/MM/DD HH:mm"))

    $("#datepicker2").datetimepicker({
        format: 'yyyy-mm-dd hh:ii',
        minuteStep: 15,
        autoclose: true,
        startDate: datetime,
        todayBtn: true
    });
});
//AutoComplete Addres
$(document).ready(function () {
    var geolocation = {
        lat: 25.6487281,
        lng: -100.4431805
    };
    var input = document.getElementById('searchTextField');
    var options = {
        componentRestrictions: {
            country: "mx"
        }
    };
    var circle = new google.maps.Circle({
        center: geolocation,
        radius: 50000,
        fields: ["name", "geometry.location", "place_id", "formatted_address"]
    });
    autocomplete = new google.maps.places.Autocomplete(input, options);
    autocomplete.setBounds(circle.getBounds());
    autocomplete.addListener('place_changed', function () {
        place = autocomplete.getPlace();
        // console.log(place)
        if (!place.geometry) {
            //If para si el usuario escribió una dirección que no se le sugirió desde el autocomplete (o por si el request falla de parta de Google por alguna razón)
            window.alert("El lugar introducido no se ha encontrado en Google Maps");
            return;
        } else {
            if ($("#typeVehicle").val() != "") {
                calculatePrice();
            }
        }
    });
});
// Validate fields
$(document).ready(function () {

    $("[id*=txn]").keydown(function (e) {
        if ($.inArray(e.keyCode, [46, 8, 9]) !== -1) {
            return;
        }
        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    $("[id*=txe]").keydown(function (e) {

        var text = $("[id*=txe]").val()

        if ($.inArray(e.keyCode, [46, 8, 9]) !== -1) {
            return;
        }
        if (text.length == 2 && $.inArray(e.keyCode, [16, 111, 55]) !== -1) {
            e.preventDefault();
        } else if (text.length == 2) {
            $("[id*=txe]").val($("[id*=txe]").val() + '/')
        }


        if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
        }
    });

    $("[id*=txT]").keydown(function (e) {
        key = e.keyCode || e.which;
        tecla = String.fromCharCode(key).toLowerCase();
        letras = " áéíóúabcdefghijklmnñopqrstuvwxyz";
        especiales = "8-37-39-46";

        tecla_especial = false
        for (var i in especiales) {
            if (key == especiales[i]) {
                tecla_especial = true;
                break;
            }
        }

        if (letras.indexOf(tecla) == -1 && !tecla_especial) {
            return false;
        }

    });
});
//typePayment
$(document).ready(function () {
    var data = {};
    data.field = 'OptypePayment'
    $.post(api + "api/fieldOptions/filter", {
        data: data
    }, function (resp) {
        // console.log(resp);
        typePayment = resp

    }, "json");
});
// BankTerminal
$(document).ready(function () {
    var data = {};
    data.field = 'OpBankTerminal'
    $.post(api + "api/fieldOptions/filter", {
        data: data
    }, function (resp) {
        // console.log(resp);
        BankTerminal = resp

    }, "json");
});
// OptypeSale
$(document).ready(function () {
    var data = {};
    data.field = 'OptypeSale'
    $.post(api + "api/fieldOptions/filter", {
        data: data
    }, function (resp) {
        // console.log(resp);
        OptypeSale = resp

    }, "json");
});

$(document).ready(function () {
    $("#btnpay").click(function () {
        alert('test');
    });
    $("#btnpay").off('click');

});

function getInitialTime(dt, hours, minutes) {
    var month = dt.getMonth() + 1;
    var day = dt.getDate();
    var year = dt.getFullYear();

    if (minutes >= 0 && minutes <= 15) {
        minutes = 30;
        hours = hours + 1;
    } else if (minutes > 15 && minutes <= 30) {
        minutes = 45;
        hours = hours + 1
    } else if (minutes > 30 && minutes <= 45) {
        minutes = '00';
        hours = hours + 2;
    } else if (minutes > 45 && minutes <= 59) {
        minutes = 15;
        hours = hours + 2;
    }

    if (hours == 24) {
        hours = '00';
        day = day + 1;
    } else if (hours == 25) {
        hours = 1;
        day = day + 1;
    }
    var datetime = year + '-' + month + '-' + day + ' ' + hours + ":" + minutes;
    // console.log(datetime);
    return datetime;
}

var realCouponId;

function calculatePrice() {
    $("#checkboxRegreso").prop("checked", false);
    $("#checkboxRegreso").val(false)
    refresoCuadro= false
    $("#divRegreso").hide();
    if (place) {

        const data = {
            userId: userId,
            requestTime: moment($("#datepicker").val()),
            taxiType: $("#typeVehicle").val(),
            origin: [place.geometry.location.lat(), place.geometry.location.lng()],
            dest: [25.776803, -100.118272],
            toZone: "5a78bcaec1523b4a3cf26cba"
        };

        if(realCouponId==null){
            realCouponId=undefined
        }
        data.couponId = realCouponId;

        $.post(api + "api/zones/getEstimate", JSON.parse(JSON.stringify(data)), function (estimate) {
            if (estimate) {
                if (estimate.error)
                    swal({
                        title: "Ups!",
                        text: estimate.error,
                        type: "error"
                    }, function () {
                        $("#datepicker").val('');
                        refresDatePicker()
                    });
                else
                    $("#txnprice").val(estimate[0].cost);
                    priceTrip = estimate[0].cost;
                    if(realCouponId==undefined){
                        originPriceTrip = estimate[0].cost
                    }else{
                        if( redondo == "Si" ){
                            $("#txnprice").val( parseInt(estimate[0].cost) + originPriceTrip);
                            priceTrip = parseInt(estimate[0].cost) + originPriceTrip;
                        }
                    }
            }

        }, "json");

    } else {
        swal({
            title: "Ups!",
            text: "Introduce una dirección válida",
            // html: true,
            type: "warning"
        }, function () {
            $("#typeVehicle").val("")
        });

        return;
    }
}

function validate(type) {

    if (type == "card") {
        var car = $('#txncardNumber').val();
        if (car.length < 15) {
            $('#idCard').html("Longitud incorrecta");
            document.getElementById("divTarjeta").className = "form-group col-md-6 has-error";
        } else {
            if (!OpenPay.card.validateCardNumber(car)) {
                $('#idCard').html("Número de tarjeta invalido");
                document.getElementById("divTarjeta").className = "form-group col-md-6 has-error";
            } else {
                $('#idCard').html(OpenPay.card.cardType(car));
                document.getElementById("divTarjeta").className = "form-group col-md-6 has-success";
            }
        }
    } else if (type == "cvc") {
        var car = $('#txncardNumber').val();
        var cvc = $('#txncvv').val();
        // console.log(cvc)
        if (car.length < 15) {
            $('#idCard').html("Longitud incorrecta");
            document.getElementById("divTarjeta").className = "form-group col-md-6 has-error";
        }
        if (cvc.length < 3) {
            $('#idCVC').html("Longitud incorrecta");
            document.getElementById("divCVV").className = "form-group col-xs-6 col-md-3 has-error";
        } else {
            if (!OpenPay.card.validateCVC(cvc, car)) {
                $('#idCVC').html("Número de CVC invalido");
                document.getElementById("divCVV").className = "form-group col-xs-6 col-md-3 has-error";
            } else {
                $('#idCVC').html("");
                document.getElementById("divCVV").className = "form-group col-xs-6 col-md-3 has-success";
            }
        }
    } else if (type == "exp") {

        var dateexp = $('#txeexpirationDate').val();
        if (dateexp < 5) {
            $('#idExpiration').html("Longitud incorrecta");
            document.getElementById("divEXP").className = "form-group col-xs-6 col-md-3 has-error";
        } else {
            if (!OpenPay.card.validateExpiry(getExpirationDate(dateexp, "month"), getExpirationDate(dateexp, "year2"))) {
                $('#idExpiration').html("Fecha incorrecta");
                document.getElementById("divEXP").className = "form-group col-xs-6 col-md-3 has-error";
            } else {
                $('#idExpiration').html("");
                document.getElementById("divEXP").className = "form-group col-xs-6 col-md-3 has-success";
            }
        }
    } else if (type == "email") {
        var email = $('#email').val();
        if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/.test(email)) {
            $('#idEmail').html("");
            document.getElementById("divEmail").className = "form-group col-md-3 has-success";
        } else {

            $('#idEmail').html("Dirección de correo incorrecto");
            document.getElementById("divEmail").className = "form-group col-md-3 has-error";
        }
    }

}

function getExpirationDate(date, opc) {
    // console.log(date + '-' + opc)
    var arr = date.split("/")
    if (opc == "month") {
        return arr[0]
    } else if (opc == "year") {
        return arr[1]
    } else if (opc == "year2") {
        return arr[1]
    }

}

var userId;

function getId() {
    $.post(api + "api/users/rider/getId", {
        body: {
            email: $("#email").val(),
            phoneNo: $("#txnphoneNumber").val()
        }
    }, function (resp) {
        if (resp)
            userId = resp._id;

    }, "json");

}

function registerCoupon() {
    if ($("#txtcoupon").val() != "") {
        couponId = $("#txtcoupon").val();
        $.post(api + "api/coupons/registerCoupon", {
            userId: userId,
            coupon: couponId,
            unitType: $('#typeVehicle').val(),
            requestTime: moment($("#datepicker").val()).toISOString(),
            itsFromWeb: true
        }, function (resp) {
            if (resp._id) {
                realCouponId = resp._id;
                swal({
                    title: "Excelente!",
                    text: "Cupón valido",
                    // html: true,
                    type: "success"
                }, function () {
                    calculatePrice()
                });
            } else {
                swal({
                    title: "Ups!",
                    text: resp.msg,
                    // html: true,
                    type: "error"
                }, function () {
                    $("#txtcoupon").val("")
                    realCouponId = null;
                    calculatePrice()
                });
            }
        }, "json");
    }
}

function cambiar() {
    $('#btnpay').removeAttr('onclick').click();
    $("#btnpay").attr('disabled', 'disabled');
}

function pay() {
    var validateH = moment().format('HH')
    if(validateH >=22 || validateH <= 8 ){


        swal({
            title: "Ups!",
            text: "Error, El horario para reservar es de 8:00am a 10:00pm",
            type: "error"
        }, function () {
            location.reload();
        });

    } else{

        if(refresoCuadro == true){
            if($("#aerolinea").val() != "" && $("#nVuelo").val() != "" && $("#datepicker2").val() != "" ){
            } else {
                swal({
                    title: "Ups!",
                    text: "Introduce la información de Regreso",
                    // html: true,
                    type: "warning"
                }, function () {
                });
                return;
            }
        }   

    
    cambiar();
    $("#btnpay").attr('disabled', 'disabled');


    if (place &&
        $("#datepicker").val() != "" &&
        $("#typeVehicle").val() != "" &&
        (priceTrip > 0 && priceTrip != "" && $("#txnprice").val() != "") &&
        $("#txTriderName").val() != "" &&
        $("#txTriderName2").val() != "" &&
        $("#txnphoneNumber").val() != "" &&
        $("#email").val() != "" &&
        $("#txTcardName").val() != "" &&
        $("#txncardNumber").val() != "" &&
        $("#txeexpirationDate").val() != "" &&
        $("#txncvv").val() != "" &&
        document.getElementById("divEmail").className.indexOf("has-error") == -1 &&
        document.getElementById("divTarjeta").className.indexOf("has-error") == -1 &&
        document.getElementById("divEXP").className.indexOf("has-error") == -1 &&
        document.getElementById("divCVV").className.indexOf("has-error") == -1
    ) {



        swal({
            title: "Confirma tus datos de reservación!",
            text: "Dia: " + moment($("#datepicker").val()).format("YYYY/MM/DD") +
                "\nHora: " + moment($("#datepicker").val()).format("HH:mm") + " hrs" +
                "\nOrigen: " + $("#searchTextField").val() +
                "\nRedondo: " + redondo +
                "\nTotal: $ " + priceTrip + "MXN",
            type: "info",
            showCancelButton: true,
            confirmButtonClass: "btn-primary",
            confirmButtonText: "Si, realizar pagó",
            cancelButtonText: "No",
            closeOnConfirm: false,
            closeOnCancel: false
        }, function (isConfirm) {
            if (isConfirm) {
                swal.close();
                OpenPay.setId('my7g7bmiiq6vxsztm85d')
                OpenPay.setApiKey('pk_93e023b4cc354e31a968a92761108766')
                OpenPay.setSandboxMode(true)
                // OpenPay.getSandboxMode();
                // console.log($scope.expira)
                 var newArr = ("20" + getExpirationDate($("#txeexpirationDate").val(), "year"))
                var ClientData = {
                    "card_number": $("#txncardNumber").val(),
                    "holder_name": $("#txTcardName").val(),
                    "expiration_year": getExpirationDate($("#txeexpirationDate").val(), "year"),
                    "expiration_month": getExpirationDate($("#txeexpirationDate").val(), "month"),
                    "cvv2": $("#txncvv").val(),
                }
                OpenPay.token.create(ClientData, onSuccess, onError);
            } else {
                swal.close();
                $("#btnpay").prop("disabled", false);
                $("#btnpay").removeAttr('disabled', 'disabled');
                $('#btnpay').attr('onclick', 'pay();');
                $("#datepicker").val('');
                // $("#typeVehicle").val('');
                // priceTrip = 0;
                // $("#txnprice").val('');
                refresDatePicker();
            }
        });

    } else {
        swal({
            title: "Ups!",
            text: "Por favor, valida que todos los campos esten llenados correctamente!",
            // html: true,
            type: "error"
        }, function () {
            $("#btnpay").prop("disabled", false);
            $("#btnpay").removeAttr('disabled', 'disabled');
            $('#btnpay').attr('onclick', 'pay();');
            $("#datepicker").val('');
            refresDatePicker();
        });
    }
    }
}

function onSuccess(response) {
    $("#btnpay").prop("disabled", true);
    // console.log("Onsuccesss----------------------------")
    // console.log(response);

    var deviceSessionId = OpenPay.deviceData.setup("submit_form", "hiddenID");

    response.data.idSession = deviceSessionId;
    response.data.amount = priceTrip;
    response.data.correo = $("#email").val();
    response.data.descripcion = "PaymentPortal";
    response.data.trip = {
        srcLoc: [place.geometry.location.lat(), place.geometry.location.lng()],
        destLoc: ["25.776803", "-100.118272"],
        pickUpAddress: $("#searchTextField").val(),
        destAddress: "Aeropuerto MTY Caseta CASCO",
        requestIme: moment($("#datepicker").val()).toISOString(),
        unitType: $('#typeVehicle').val(),
        amount: $('#txnprice').val(),
        riderName: $('#txTriderName').val(),
        riderName2: $('#txTriderName2').val(),
        phoneNumber: $('#txnphoneNumber').val(),
        email: $('#email').val()
    }
    response.data.RFC_Emisor = "CTR030123ICA";


    $.post(api + "api/payment/PaymentPortal", {
        data: response.data
    }, function (resp) {

        if (!resp.http_code) {
            response.openpay = resp;
            createClient(response);
        } else {
            var message;
            if (resp.error_code == 2005)
                message = "Error en la fecha de expiración"
            else if (resp.error_code == 3001)
                message = "La tarjeta fue rechazada"
            else if (resp.error_code == 3002)
                message = "La tarjeta ha expirado"
            else if (resp.error_code == 3003)
                message = "La tarjeta no tiene fondos suficientes"
            else if (resp.error_code == 3004)
                message = "La tarjeta ha sido identificada como una tarjeta robada"
            else if (resp.error_code == 3005)
                message = "La tarjeta ha sido rechazada por el sistema antifraudes"
            else
                message = "Error no identificado"
            swal({
                title: "Ups!",
                text: "Error en la transacción\n" + message,
                type: "error"
            }, function () {
                // $('#btnpay').removeAttr('onclick').click();
                $("#btnpay").removeAttr('disabled', 'disabled');
                $('#btnpay').attr('onclick', 'pay();');
                // location.reload();
            });

        }

    }, "json");

}

function createClient(data) {
    // console.log(".i.i.i.i.i.i.i.i.i.i.i.i.i. :DDDDD")
    // console.log(data)
    $.post(api + "api/users/registerPortal", {
        body: data.openpay.user
    }, function (resp) {
        // console.log(resp.data);
        data.openpay.user._id = resp.data.user._id;
        save(data);

    }, "json");

}

function onError(response) {
    // console.log(response)
    var message;
    if (response.data.error_code == 2005)
        message = "Error en la fecha de expiración"
    else if (response.data.error_code == 3001)
        message = "La tarjeta fue rechazada"
    else if (response.data.error_code == 3002)
        message = "La tarjeta ha expirado"
    else if (response.data.error_code == 3003)
        message = "La tarjeta no tiene fondos suficientes"
    else if (response.data.error_code == 3004)
        message = "La tarjeta ha sido identificada como una tarjeta robada"
    else if (response.data.error_code == 3005)
        message = "La tarjeta ha sido rechazada por el sistema antifraudes"
    else
        message = "Error no identificado"
    swal({
        title: "Ups!",
        text: "Error en la transacción\n" + message,
        type: "error"
    }, function () {
        location.reload();
    });

}

function save(data) {
    // console.log("saveData")
    // console.log(data)

    var cashBoxData = {};
    var cardtype;
    if (data.data.card.type == "debit") {
        cardtype = 'TD';
    } else if (data.data.card.type == "credit") {
        cardtype = 'TC';
    } else {
        cardtype = 'TC';
    }

    // console.log($scope.data.OptypeSale)
    OptypeSale.forEach(function (sale) {
        if (sale.value == 'VW') {
            cashBoxData.OptypeSale = sale._id
        }
    });
    // console.log(data.typePayment)
    typePayment.forEach(function (typePayment) {
        if (typePayment.value == cardtype && typePayment.description != "Empresarial") {
            cashBoxData.OptypePayment = typePayment._id
        }
    });
    // console.log(data.BankTerminal)
    BankTerminal.forEach(function (BankTerminal) {
        if (BankTerminal.value == 'TV_A') {
            cashBoxData.OpBankTerminal = BankTerminal._id
        }
    });

    cashBoxData.folioTransaction = data.openpay.authorization
    cashBoxData.pay = data.data.amount
    cashBoxData.changePrice = false
    cashBoxData.usersCashBox = data.openpay.user._id,
        cashBoxData.RFC_Emisor = 'CTR030123ICA'


    // Crear CashBox
    $.post(api + "api/cashBox/", {
        data: cashBoxData
    }, function (resp) {
        // console.log("Save CashBox")
        // console.log(resp);

        if( redondo == "Si" ){
            var options= ["VIP", "redondo"]
            var vip={
                aerolinea : $("#aerolinea").val(),
                cliente : $("#txTcardName").val(),
                fechaRegreso : moment($("#datepicker2").val()).format("YYYY/MM/DD HH:mm"),
                nVuelo : $("#nVuelo").val(),
                terminal : $("#terminal").val()
            }
        }else{
            var options= []
            var vip = undefined
        }
        var tripRequestObj = {
            riderId: data.openpay.user._id,
            srcLoc: data.data.trip.srcLoc,
            destLoc: data.data.trip.destLoc,
            pickUpAddress: data.data.trip.pickUpAddress,
            destAddress: data.data.trip.destAddress,
            taxiType: data.data.trip.unitType,
            coupon: realCouponId,
            cashBox: resp._id,
            tripRequestStatus: "scheduled",
            xdsFlag: false,
            openpay: data.openpay,
            riderData: {
                lname: data.data.trip.riderName2,
                fname: data.data.trip.riderName,
                email: data.data.trip.email,
                phoneNo: data.data.trip.phoneNumber
            },
            tripAmt: data.data.amount,
            tripAmtDriver: originalPrice,
            requestTime: data.data.trip.requestIme,
            requestTripFrom: 'ReservaWebPagada',
            options,
            vip
        };

        $.post(api + "api/futureTrips", {
            data: tripRequestObj
        }, function (resp) {
            // var date = new Date(resp.requestTime);
            // var month = date.getMonth() + 1;
            if(resp.roundsTrips){
                resp.tripAmt = resp.roundsTrips.totalCost
            }
            swal({
                title: "Tu reservación y pago se han registrado correctamente!",
                text: "\nBoleto: " + resp.folio +
                    "\nOrigen: " + resp.pickUpAddress +
                    "\nDestino: " + resp.destAddress +
                    "\nFecha Reservacion: " + moment(resp.requestTime).format("YYYY/MM/DD") +
                    "\nHora Reservacion: " + moment(resp.requestTime).format("HH:mm") +
                    "\nRedondo: " + redondo +
                    "\nTotal: $" + resp.tripAmt,
                type: "success"
            }, function () {
                $("#btnpay").prop("disabled", false);
                location.reload();
            });

        }, "json");

    }, "json");

}


function getMaxSaturation() {
    // console.log("getMaxSaturation........................")

    $.post(api + "api/fieldOptions/All", {
        field: 'OpSaturation'
    }, function (resp) {
        maxSaturation = resp[0].value;
        // console.log("maxSaturation:" + maxSaturation)
    }, "json");
}



function countTripsAvailables() {
    if ($("#typeVehicle").val() != "") {
        calculatePrice();
    }
    var requestTime = moment($("#datepicker").val()).format("YYYY-MM-DD HH:mm")
    var maxTrip = maxSaturation;
    $.post(api + "api/futureTrips/numtripavailable", {
        requestTime: requestTime
    }, function (resp) {
        // console.log(resp);
        if (resp.length > 0) {
            for (let index = 0; index < resp.length; index++) {
                var request = resp[index];
                if (moment(request._id).format("YYYY-MM-DD HH:mm") == requestTime) {
                    if (request.count >= maxTrip) {
                        swal({
                            title: "Ups!",
                            text: "Lo sentimos ya no contamos con más reservaciones para esa fecha y hora en específico.\n\nPor favor intenta con 15 minutos más o 15 minutos menos.",
                            type: "error"
                        }, function () {
                            $("#datepicker").val('');
                            refresDatePicker()
                        });
                    } else {
                        if ($("#typeVehicle").val() != "") {
                            calculatePrice();
                        }
                    }
                }
            }
        }


    }, "json");
}

function refresDatePicker() {
    var dt = new Date();
    var datetime = getInitialTime(dt, dt.getHours(), dt.getMinutes());
    // console.log(".i." + datetime);
    $("#datepicker").datetimepicker({
        format: 'yyyy-mm-dd hh:ii',
        minuteStep: 15,
        autoclose: true,
        startDate: datetime,
        todayBtn: true
    });
}

function refresDatePicker2() {
    var dt = new Date();
    var datetime = getInitialTime(dt, dt.getHours(), dt.getMinutes());
    // console.log(".i." + datetime);
    $("#datepicker").datetimepicker({
        format: 'yyyy-mm-dd hh:ii',
        minuteStep: 15,
        autoclose: true,
        startDate: datetime,
        todayBtn: true
    });
}

let refresoCuadro = false
function regresoCheck() {
    if ($("#txnprice").val() !="" ){
    } else {
        $("#checkboxRegreso").prop("checked", false);
        swal({
            title: "Ups!",
            text: "Introduce la información de arriba",
            // html: true,
            type: "warning"
        }, function () {
            $("#checkboxRegreso").val(false)
            refresoCuadro= false
            $("#divRegreso").hide();
        });
        return;
    }

    if($("#checkboxRegreso").val() != true && refresoCuadro !=true){
        $("#checkboxRegreso").val(true)
        refresoCuadro =true
    } else{
        $("#checkboxRegreso").val(false)
        refresoCuadro= false
        redondo = "No"
        $("#terminal").val("")
        $("#aerolinea").val("")
        $("#nVuelo").val("")
        $("#fechaRegreso").val("")
    }

    if(refresoCuadro == true){
        $("#divRegreso").show();
        var numero = parseInt($("#txnprice").val())

        if(realCouponId==undefined){
            $("#txnprice").val(numero + numero)
            priceTrip = numero + numero
        }else{
            priceTrip = parseInt(priceTrip) + parseInt(originPriceTrip)
            $("#txnprice").val(parseInt(numero) + parseInt(originPriceTrip))
        }

        redondo = "Si"
        var opcion  = 'VIP'
    } else{    
        $("#divRegreso").hide();
        calculatePrice();
        var opcion = undefined
        originPriceTrip = estimate[0].cost
    }
}

function reCalculatePrice() {
    registerCoupon()
    if ($("#typeVehicle").val() != "") {
        calculatePrice();
    }
}