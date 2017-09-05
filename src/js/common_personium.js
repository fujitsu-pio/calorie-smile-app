/**
 * Personium
 * Copyright 2017 FUJITSU LIMITED
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * The following methods should be shared amoung all cell applications.
 */
cs.approvalRel = function(extCell, uuid, msgId) {
    cs.changeStatusMessageAPI(uuid, "approved").done(function() {
        $("#" + msgId).remove();
        cs.getAllowedCellList();
        var title = i18next.t("readResponseTitle");
        var body = i18next.t("readResponseApprovedBody");
        cs.sendMessage(uuid, extCell, "message", title, body);
    });
};

cs.rejectionRel = function(extCell, uuid, msgId) {
    cs.changeStatusMessageAPI(uuid, "rejected").done(function() {
        $("#" + msgId).remove();
        cs.getAllowedCellList();
        var title = i18next.t("readResponseTitle");
        var body = i18next.t("readResponseDeclinedBody");
        cs.sendMessage(uuid, extCell, "message", title, body);
    });
};

cs.changeStatusMessageAPI = function(uuid, command) {
    var data = {};
    data.Command = command;
    return $.ajax({
            type: "POST",
            url: Common.getCellUrl() + '__message/received/' + uuid,
            data: JSON.stringify(data),
            headers: {
                    'Authorization':'Bearer ' + Common.getToken()
            }
    })
};

cs.getAllowedCellList = function() {
    let extCellUrl = [
        Common.getCellUrl(),
        '__ctl/Relation(Name=\'',
        getAppReadRelation(),
        '\',_Box\.Name=\'',
        Common.getBoxName(),
        '\')/$links/_ExtCell'
    ].join("");
    
    $.ajax({
        type: "GET",
        url: extCellUrl,
        headers: {
            'Authorization':'Bearer ' + Common.getToken(),
            'Accept':'application/json'
        }
    }).done(function(data) {
        cs.dispAllowedCellList(data);
    });
};

cs.dispAllowedCellList = function(json) {
    $("#allowedCellList").empty();
    var results = json.d.results;
    if (results.length > 0) {
        results.sort(function(val1, val2) {
          return (val1.uri < val2.uri ? 1 : -1);
        })

        for (var i in results) {
          var uri = results[i].uri;
          var matchUrl = uri.match(/\(\'(.+)\'\)/);
          var extUrl = matchUrl[1];

          cs.dispAllowedCellListAfter(extUrl, i);
        }
    }
};

cs.dispAllowedCellListAfter = function(extUrl, no) {
    cs.getProfile(extUrl).done(function(data) {
        var dispName = Common.getCellNameFromUrl(extUrl);
        if (data !== null) {
            dispName = data.DisplayName;
        }
        cs.appendAllowedCellList(extUrl, dispName, no)
    }).fail(function() {
        var dispName = Common.getCellNameFromUrl(extUrl);
        cs.appendAllowedCellList(extUrl, dispName, no)
    });
};

cs.appendAllowedCellList = function(extUrl, dispName, no) {
    $("#allowedCellList")
        .append('<tr id="deleteExtCellRel' + no + '"><td class="paddingTd">' + dispName + '</td><td><button onClick="cs.notAllowedCell(this)" data-ext-url="' + extUrl + '"data-i18n="btn.release">' + '</button></td></tr>')
        .localize();
};

cs.notAllowedCell = function(aDom) {
    let extUrl = $(aDom).data("extUrl");
    cs.deleteExtCellLinkRelation(extUrl, getAppReadRelation()).done(function() {
        $(aDom).closest("tr").remove();
    });
};

cs.deleteExtCellLinkRelation = function(extCell, relName) {
    var urlArray = extCell.split("/");
    var hProt = urlArray[0].substring(0, urlArray[0].length - 1);
    var fqdn = urlArray[2];
    var cellName = urlArray[3];
    return $.ajax({
            type: "DELETE",
            url: Common.getCellUrl() + '__ctl/ExtCell(\'' + hProt + '%3A%2F%2F' + fqdn + '%2F' + cellName + '%2F\')/$links/_Relation(Name=\'' + relName + '\',_Box.Name=\'' + Common.getBoxName() + '\')',
            headers: {
              'Authorization':'Bearer ' + Common.getToken()
            }
    });
};

cs.sendMessage = function(uuid, extCell, type, title, body, reqRel, reqRelTar) {
    Common.getAppToken().done(function(appToken) {
        Common.getAppCellToken(appToken.access_token).done(function(msgToken) {
            cs.sendMessageAPI(uuid, extCell, type, title, body, reqRel, reqRelTar).done(function(data) {
                $("#popupSendAllowedErrorMsg").html(i18next.t("msg.info.messageSent"));
            }).fail(function(data) {
                $("#popupSendAllowedErrorMsg").html(i18next.t("msg.error.failedToSendMessage"));
            });
        }).fail(function(msgToken) {
            $("#popupSendAllowedErrorMsg").html(i18next.t("msg.error.failedToSendMessage"));
        });
    }).fail(function(appToken) {
        $("#popupSendAllowedErrorMsg").html(i18next.t("msg.error.failedToSendMessage"));
    });
};

cs.sendMessageAPI = function(uuid, extCell, type, title, body, reqRel, reqRelTar) {
    var data = {};
    data.BoxBound = true;
    data.InReplyTo = uuid;
    data.To = extCell;
    data.ToRelation = null
    data.Type = type;
    data.Title = title;
    data.Body = body;
    data.Priority = 3;
    if (reqRel) {
        data.RequestRelation = reqRel;
    }
    if (reqRelTar) {
        data.RequestRelationTarget = reqRelTar;
    }

    return $.ajax({
            type: "POST",
            url: Common.getCellUrl() + '__message/send',
            data: JSON.stringify(data),
            headers: {
                    'Authorization':'Bearer ' + Common.getToken()
            }
    })
};
