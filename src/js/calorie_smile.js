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
 * The followings should be shared among applications and/or within the same application.
 */
var cs = {};

cs.accessData = {};

// Please add file names (with file extension) 
getNamesapces = function(){
    return ['common', 'glossary', 'login'];
};

// Usually the App's Personium cell and the web server reside on the same server.
getAppCellUrl = function() {
    var appUrlMatch = location.href.split("#");
    var appUrlSplit = appUrlMatch[0].split("/");
    appUrl = appUrlSplit[0] + "//" + appUrlSplit[2] + "/" + appUrlSplit[3] + "/";
    if (appUrlSplit[0].indexOf("file:") == 0) {
        appUrl = "https://demo.personium.io/hn-app-genki/";
    }

    return appUrl;
}

/*
 * clean up data for Calorie Smile
 */
cleanUpData = function() {
  sessionStorage.setItem("accessInfo", null);
};

cs.checkParam = function() {
    var msg_key = "";
    if (cs.accessData.target === null) {
        msg_key = "msg.error.targetCellNotSelected";
    } else if (cs.accessData.token ===null) {
        msg_key = "msg.error.tokenMissing";
    } else if (cs.accessData.refToken === null) {
        msg_key = "msg.error.refreshTokenMissing";
    } else if (cs.accessData.expires === null) {
        msg_key = "msg.error.tokenExpiryDateMissing";
    } else if (cs.accessData.refExpires === null) {
        msg_key = "msg.error.refreshTokenExpiryDateMissing";
    }

    if (msg_key.length > 0) {
        cs.displayMessageByKey(msg_key);
        return false;
    }

    return true;
};

cs.getName = function(path) {
  var collectionName = path;
  var recordsCount = 0;
  if (collectionName != undefined) {
          recordsCount = collectionName.length;
          var lastIndex = collectionName.lastIndexOf("/");
          if (recordsCount - lastIndex === 1) {
                  collectionName = path.substring(0, recordsCount - 1);
                  recordsCount = collectionName.length;
                  lastIndex = collectionName.lastIndexOf("/");
          }
          collectionName = path.substring(lastIndex + 1, recordsCount);
  }
  return collectionName;
};

cs.updateSessionStorageGenkikun = function(json, loginData) {
    cs.accessData.id = loginData.Id;
    cs.accessData.genkiUrl = loginData.Url;
    cs.accessData.genkiToken = json.access_token;
    cs.accessData.genkiexpires = json.expires_in;
    sessionStorage.setItem("accessInfo", JSON.stringify(cs.accessData));
};

cs.getCalorieSmileServerToken = function(startAnimation, stopAnimation, loginSucceedCallback) {
    if ($.isFunction(startAnimation)) {
        startAnimation();
    }
    cs.getGenkiAccessInfoAPI().done(function(json) {
        if ($.isEmptyObject(json)) {
            // Strange info
            // Stop animation without displaying any error
            if ($.isFunction(stopAnimation)) {
                stopAnimation();
            }
            return;
        };

        var allInfoValid = true;
        var tempData = JSON.parse(json);
        
        $.each(tempData, function(key, value) {
            if (value.length > 0) {
                // Fill in the login form
                tempData[key] = cs.updateGenkikunFormData(key, value);
            } else {
                allInfoValid = false;
            }
        });

        // Not enough info to login automatically.
        // Stop animation without displaying any error
        if (!allInfoValid) {
            if ($.isFunction(stopAnimation)) {
                stopAnimation();
            }
            return;
        }

        cs.loginGenki(tempData).done(function(data) {
            if ($.isFunction(loginSucceedCallback)) {
                loginSucceedCallback(data, tempData);
            }
        }).fail(function(data) {
            if ($.isFunction(stopAnimation)) {
                stopAnimation("login:msg.error.failedToLogin");
            }
        });
    }).fail(function() {
        // Stop animation without displaying any error
        if ($.isFunction(stopAnimation)) {
            stopAnimation();
        }
    });
};

/*
 * Get login information (Url/Id/Pw) from user's cell
 * to avoid saving data in local storage.
 * Url: Calorie Smile server's URL
 * Id:  User ID
 * Pw:  User password
 */
cs.getGenkiAccessInfoAPI = function() {
    return $.ajax({
        type: "GET",
        url: cs.accessData.target + '/GenkiKunBox/genkiAccessInfo.json',
        dataType: "text",
        headers: {
            'Authorization':'Bearer ' + cs.accessData.token,
            'Accept':'application/text'
        }
    });
};

/*
 * login and receive the server's token
 */
cs.loginGenki = function(tempData) {
    var url = tempData.Url;
    var id = tempData.Id;
    var pw = tempData.Pw;
    return $.ajax({
        type: "POST",
        //url: cs.accessData.target + '/GenkiKunService/getToken?targetUrl=' + url + 'newpersonium/Response&id=' + id + '&pass=' + pw,
        url: cs.accessData.target + '/GenkiKunService/getToken',
        data: {
            'targetUrl': url + 'newpersonium/Response',
            'id': id,
            'pass': pw
        },
        headers: {
            'Accept':'application/json',
            'Authorization':'Bearer ' + cs.accessData.token
        }
    });
};

cs.updateGenkikunFormData = function(key, value) {
    var tempValue = value;
    if (key == "Url") {
        tempValue = cs.addEndingSlash(value);
    }
    $('#iGenkikun' + key).val(tempValue);
    return tempValue;
};

cs.addEndingSlash = function(url) {
    var tempValue = url;
    if (url.slice(-1) != "/") {
        tempValue += "/";
    }

    return tempValue;
};

cs.displayMessageByKey = function(msg_key) {
    if (msg_key) {
        $('#dispMsg').attr("data-i18n", msg_key)
            .localize()
            .show();
    } else {
        $('#dispMsg').hide();
    }
};
