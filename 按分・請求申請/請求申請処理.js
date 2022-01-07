(function () {
    'use strict';
    function bill_make(bm_user_id, bm_authory_id, bm_use_date, bm_category, bm_shop, bm_amount) {
        /*
        bm_user_id -> 会員番号
        bm_authory_id -> 申請書番号
        bm_use_date -> 利用日
        bm_category -> 請求種別(按分請求・立替請求)
        bm_shop -> 加盟店名
        bm_amount -> 利用額
        */
        var user_id_veryfy = {
            "app": '20',
            "query": '会員番号="' + bm_user_id + '"',
        }
        return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', user_id_veryfy).then(function (res) {
            //API完了
            var record = res.records;
            if (record.length > 0) {
                //情報あり
                return new Promise(function (success, reject) {
                    var add1 = {
                        "app": '28',
                        "record": {
                            "会員番号": {
                                "value": bm_user_id,
                            },
                            "依頼書番号": {
                                "value": bm_authory_id,
                            },
                            "利用日": {
                                "value": bm_use_date,
                            },
                            "請求カテゴリ": {
                                "value": bm_category,
                            },
                            "加盟店名": {
                                "value": bm_shop,
                            },
                            "請求額": {
                                "value": bm_amount,
                            }
                        }
                    }
                    return kintone.api(kintone.api.url('/k/v1/record.json', true), 'POST', add1, (resp3) => {
                        //登録完了
                        //減算処理を行う
                        //まず現在の値を取得
                        var add2 = {
                            "app": '20',
                            "query": '会員番号="' + bm_user_id + '"',
                        }
                        return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', add2, (resp_ud) => {
                            //現在の利用額をあげるだけ
                            var rec1 = resp_ud.records["0"];
                            var record_id = rec1["レコード番号"]["value"];
                            var sougou_riyou = rec1["総合利用額"]["value"];
                            var am = Number(bm_amount);
                            var sr = Number(sougou_riyou);
                            var sougou_req = sr + am;
                            var check2 = {
                                "app": '20',
                                "id": record_id,
                                "record": {
                                    "総合利用額": {
                                        "value": sougou_req
                                    },
                                }
                            }
                            return kintone.api(kintone.api.url('/k/v1/record.json', true), 'PUT', check2, (req_1) => {
                                //完了
                                success();
                                return true;
                            })
                        }, function (e) {
                            console.log(e);
                        })
                    })
                })
            }
        })
    }

    function autoNum(event) {
        var record = event.record;
        var min = 10000000000;
        var max = 99999999999;
        var a = Math.floor(Math.random() * (max + 1 - min)) + min;

        var query = {
            "app": kintone.app.getId(),
            "query": '管理番号="' + a + '"'
        }

        return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', query).then(function (resp) {
            var records = resp.records;
            if (records.length > 0) {
                //レコード存在
                autoNum(event);
            } else {
                record['管理番号'].disabled = false;
                event.record['管理番号'].value = a;
            }
            return event;
        }).catch(function (e) {
            Swal.fire({
                title: "APIエラー (" + e.code + ")",
                html: "kintone API処理中にエラーが起きました。<br>" + e.message + "<br><br>Cybozu問合用ID: " + e.id,
                icon: "error",
            })
            //alert("API処理中にエラーが発生しました。 - error: "+e.message);
            return false;
        });
    }

    function pause_auth(ev1_sub, fp_status, fp_jijen, fp_ju_dtl, fp_app_id, fp_group_id, fp_div, fp_dvc_cnt) {
        //alert(fp_app_id);
        return new Promise(function (ok, ng) {
            //var input = ev1_sub.record;
            var api2 = {
                "app": '20',
                "query": '会員番号="' + fp_app_id + '"',
            }
            return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', api2).then(function (resp3) {
                if (!resp3.records.length) {
                    //対象レコードなし
                    var er = {
                        title: "入力エラー(CA-BT-80A)",
                        html: "申請者IDが相違しています",
                        icon: "error"
                    }
                    Swal.fire(er);
                    ok(false);
                } else {
                    var rec3 = resp3.records["0"];
                    var input = ev1_sub.record;
                    console.log(ev1_sub);
                    return new Promise(function (sub_ok, sub_ng) {
                        input['申請ステータス'].disabled = false;
                        input['請求額_1人当たり'].disabled = false;
                        input['事前判定結果'].disabled = false;
                        input['判定結果詳細'].disabled = false;
                        input['申請者名義'].disabled = false;
                        input['請求先名義'].disabled = false;
                        input['按分人数'].disabled = false;
                        sub_ok();
                    }).then(function () {
                        //alert(input['按分対象額'].value);
                        input["申請ステータス"].value = fp_status
                        input["事前判定結果"].value = fp_jijen;
                        input["判定結果詳細"].value = fp_ju_dtl;
                        input["申請者名義"].value = rec3["氏"]["value"] + "　" + rec3["名"]["value"];
                        input["請求先名義"].value = "グループ請求: " + fp_group_id;
                        input["按分人数"].value = fp_dvc_cnt;
                        input["請求額_1人当たり"].value = fp_div;
                        //alert("完了")
                        ok(ev1_sub);
                        //return ev1_sub;
                    })
                }
            }, function (e) {
                ng(new Error(e));
            })
        })
    }

    function pause_auth_kojin(ev1_sub, fp_status, fp_jijen, fp_ju_dtl, fp_app_id, fp_bill_id, fp_amount) {
        return new Promise(function (ok1, ng1) {
            var api2 = {
                "app": '20',
                "query": '会員番号="' + fp_app_id + '"'
            }
            return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', api2).then(function (resp3) {
                if (!resp3.records.length) {
                    //対象レコードなし
                    var er = {
                        title: "入力エラー(CA-PM-10)",
                        html: "申請者IDが入力されていないか存在しません",
                        icon: "error"
                    }
                    Swal.fire(er);
                    ok1(false);
                } else {
                    //存在した場合
                    var api3 = {
                        "app": '20',
                        "query": '会員番号="' + fp_bill_id + '"'
                    }
                    return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', api3).then(function (resp4) {
                        if (!resp4.records.length) {
                            //請求対象レコードなし
                            var er = {
                                title: "入力エラー(CA-PM-70)",
                                html: "請求先IDが入力されていないか存在しません",
                                icon: "error"
                            }
                            Swal.fire(er);
                            ok1(false);
                        } else {
                            var rec3 = resp3.records["0"];
                            var rec4 = resp4.records["0"];
                            var input = ev1_sub.record;
                            console.log(ev1_sub);
                            return new Promise(function (sub_ok, sub_ng) {
                                input['申請ステータス'].disabled = false;
                                input['請求額_1人当たり'].disabled = false;
                                input['事前判定結果'].disabled = false;
                                input['判定結果詳細'].disabled = false;
                                input['申請者名義'].disabled = false;
                                input['請求先名義'].disabled = false;
                                input['按分人数'].disabled = false;
                                sub_ok();
                            }).then(function () {
                                //ev_sub1, fp_status, fp_jijen, fp_ju_dtl, fp_app_id, fp_bill_id, fp_amount
                                //alert(input['按分対象額'].value);
                                input["申請ステータス"].value = fp_status
                                input["事前判定結果"].value = fp_jijen;
                                input["判定結果詳細"].value = fp_ju_dtl;
                                input["申請者名義"].value = rec3["氏"]["value"] + rec3["名"]["value"];
                                input["請求先名義"].value = "個人請求: " + rec4["氏"]["value"] + "　" + rec4["名"]["value"];
                                input["按分人数"].value = "0";
                                input["請求額_1人当たり"].value = fp_amount;
                                //alert("完了")
                                ok1(ev1_sub);
                                //return ev1_sub;
                            })
                        }
                    })
                }
            })
        })
    }

    var sel1 = ['app.record.create.change.申請項目', 'app.record.edit.change.申請項目'];
    kintone.events.on(sel1, function (ev2) {
        var r1 = ev2.record;
        var s1 = r1['申請項目'].value;

        if (s1 === "按分申請") {
            //按分のとき
            r1['請求先ID'].value = "";
            r1['按分グループID'].disabled = false;
            r1['請求先ID'].disabled = true;
        } else if (s1 === "請求申請") {
            r1['按分グループID'].value = "";
            r1['按分グループID'].disabled = true;
            r1['請求先ID'].disabled = false;
        }

        return ev2;
    })

    kintone.events.on('app.record.edit.submit', function (sbm_ev) {
        //差戻等の編集を想定
        var r = sbm_ev.record;
        var st = r["申請ステータス"].value;
        if (st === "差戻") {
            r["申請ステータス"].value = "審査中";
        }
        return sbm_ev;
    })

    kintone.events.on('app.record.create.submit', function (ev1) {
        var category = ev1.record['申請項目'].value;
        var application_user_id = ev1.record['申請者ID'].value;
        var use_date = ev1.record['利用日'].value;
        var amount = ev1.record['按分対象額'].value;
        var place = ev1.record['加盟店名'].value;
        var authory_id = ev1.record['管理番号'].value;
        var pay_category = ev1.record['購入カテゴリ'].value;

        if (category === "按分申請") {
            //按分申請の処理
            var group_id = ev1.record['按分グループID'].value;
            if (!group_id) {
                return new kintone.Promise(function (resolve1, reject1) {
                    Swal.fire({
                        title: "入力エラー(CA-BT-42)",
                        html: "按分グループIDが入力されていないか存在しません",
                        icon: "error"
                    })
                    return resolve1(false);
                })
            } else {
                //処理続行
                var check_groupid = {
                    "app": "30",
                    "query": '管理コード="' + group_id + '"'
                };

                return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', check_groupid).then(function (resp1) {
                    //resp1
                    if (!resp1.records.length) {
                        return new kintone.Promise(function (resolve2, reject2) {
                            Swal.fire({
                                title: "入力エラー(CA-BT-42)",
                                html: "按分グループIDが入力されていないか存在しません",
                                icon: "error"
                            })
                            resolve2(false);
                        })
                    }
                    var user_count = resp1.records["0"]['会員一覧'].value.length;
                    var divide = Math.ceil(amount / user_count);

                    return new kintone.Promise(function (resolve3, reject3) {
                        Swal.fire({
                            title: "申請前確認(HO-IS-DV-0128)",
                            html: "次の通り申請を行います。よろしいですか？<br>・按分対象額:" + amount + "円<br>・按分人数:" + user_count + "人<br>・1人当たりの按分額：約" + divide + "円",
                            icon: "info",
                            showCancelButton: true,
                            confirmButtonText: 'はい',
                            cancelButtonText: 'いいえ'
                        }).then(function (val1_arr) {
                            var val1 = val1_arr.value
                            if (!val1) {
                                return new kintone.Promise(function (resolve4, reject4) {
                                    swal({
                                        title: "処理キャンセル(HO-UI-XX-9999)",
                                        html: "停止処理をキャンセルしました",
                                        icon: "success"
                                    })
                                    resolve3(false);
                                    resolve4(false);
                                })
                            } else {
                                //処理を続行する。
                                //カテゴリーごとに基準額を判定し保留かOKかを確認する
                                if (pay_category === "その他") {
                                    //保留
                                    var etc_category_name = ev1.record['その他の場合'].value;
                                    if (!etc_category_name) {
                                        return new kintone.Promise(function (resolve4, reject4) {
                                            Swal.fire({
                                                title: "入力エラー(CA-BT-80)",
                                                html: "その他の場合、何の請求かを入力する必要があります。",
                                                icon: "error"
                                            })
                                            resolve3(false);
                                            resolve4(false);
                                        })
                                    }
                                    return new kintone.Promise(function (resolve, reject) {
                                        Swal.fire({
                                            title: "審査保留(HO-AM-ST-2037)",
                                            html: 'この申請は保留となりました。<br>審査結果は数日中に更新されますのでお待ちください<br>場合によって確認をさせていただきますのでご了承ください<br><br>申請にはレシート(原本)が必要です。<br>レシート裏面に『<font color="red"><b>' + authory_id + '</b></font>』を記載の上ご提出ください。',
                                            icon: "warning"
                                        }).then(function () {
                                            var judge_dtl = "◆自動判定◆\n結果：保留\nカテゴリ:その他＿" + etc_category_name;
                                            return pause_auth(ev1, "審査中", "判定保留(調査要)", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                                //成功
                                                resolve(data);
                                                //resolve3(data);
                                                return data;
                                            }, function (e) {
                                                Swal.fire(e.er);
                                            })
                                        })
                                    })
                                } else if (pay_category === "日用品") {
                                    //4000円以上で保留
                                    if (amount >= 4000) {
                                        //保留
                                        return new kintone.Promise(function (resolve, reject) {
                                            Swal.fire({
                                                title: "審査保留(HO-AM-ST-2037)",
                                                html: 'この申請は保留となりました。<br>審査結果は数日中に更新されますのでお待ちください<br>場合によって確認をさせていただきますのでご了承ください<br><br>申請にはレシート(原本)が必要です。<br>レシート裏面に『<font color="red"><b>' + authory_id + '</b></font>』を記載の上ご提出ください。',
                                                icon: "warning"
                                            }).then(function () {
                                                var judge_dtl = "◆自動判定◆\n結果：保留\nカテゴリ:日用品＿規定額以上";
                                                return pause_auth(ev1, "審査中", "判定保留(調査要)", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                                    //成功
                                                    console.log(data);
                                                    resolve(data);
                                                    //resolve3(data);
                                                    return data;
                                                }, function (e) {
                                                    Swal.fire(e.er);
                                                })
                                            })
                                        })
                                    } else {
                                        //続行
                                        //繰り返し処理が必要
                                        var user_id = "";
                                        var ref_place = "△返金△ " + place;
                                        var ref_amount = -divide * (user_count - 1);
                                        const billmake = (step) => {
                                            return new Promise(resolve => {
                                                //Promise処理をする内容を記載する
                                                /*
                                                bm_user_id -> 会員番号
                                                bm_authory_id -> 申請書番号
                                                bm_use_date -> 利用日
                                                bm_category -> 請求種別(按分請求・立替請求)
                                                bm_shop -> 加盟店名
                                                bm_amount -> 利用額
                                                */
                                                user_id = resp1.records["0"]["会員一覧"]["value"][step]["value"]["会員番号"]["value"];
                                                if (user_id === application_user_id) {
                                                    //一致しているときは返金処理を行う
                                                    bill_make(user_id, authory_id, use_date, "按分請求", ref_place, ref_amount);
                                                } else {
                                                    bill_make(user_id, authory_id, use_date, "按分請求", place, divide);
                                                }
                                                resolve();
                                            })
                                        }
                                        async function bill_m() {
                                            for (var i = 0; i < user_count; i++) {
                                                console.log(i + "回目")
                                                const res = await billmake(i);
                                                console.log(res);
                                            }
                                        }
                                        bill_m();
                                        var judge_dtl = "◆自動判定◆\n結果：OK\nカテゴリ:日用品＿規定額以内";
                                        return pause_auth(ev1, "登録済", "判定OK", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                            //成功
                                            console.log(data);
                                            //resolve(data);
                                            //resolve3(data);
                                            return data;
                                        }, function (e) {
                                            Swal.fire(e.er);
                                        })
                                    }
                                } else if (pay_category === "食料品") {
                                    //5000円以上で保留
                                    if (amount >= 5000) {
                                        //保留
                                        return new kintone.Promise(function (resolve, reject) {
                                            Swal.fire({
                                                title: "審査保留(HO-AM-ST-2037)",
                                                html: 'この申請は保留となりました。<br>審査結果は数日中に更新されますのでお待ちください<br>場合によって確認をさせていただきますのでご了承ください<br><br>申請にはレシート(原本)が必要です。<br>レシート裏面に『<font color="red"><b>' + authory_id + '</b></font>』を記載の上ご提出ください。',
                                                icon: "warning"
                                            }).then(function () {
                                                var judge_dtl = "◆自動判定◆\n結果：保留\nカテゴリ:食料品＿規定額以上";
                                                return pause_auth(ev1, "審査中", "判定保留(調査要)", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                                    //成功
                                                    console.log(data);
                                                    resolve(data);
                                                    //resolve3(data);
                                                    return data;
                                                }, function (e) {
                                                    Swal.fire(e.er);
                                                })
                                            })
                                        })
                                    } else {
                                        //続行
                                        //繰り返し処理が必要
                                        var user_id = "";
                                        var ref_place = "△返金△ " + place;
                                        var ref_amount = -divide * (user_count - 1);
                                        const billmake = (step) => {
                                            return new Promise(resolve => {
                                                //Promise処理をする内容を記載する
                                                /*
                                                bm_user_id -> 会員番号
                                                bm_authory_id -> 申請書番号
                                                bm_use_date -> 利用日
                                                bm_category -> 請求種別(按分請求・立替請求)
                                                bm_shop -> 加盟店名
                                                bm_amount -> 利用額
                                                */
                                                user_id = resp1.records["0"]["会員一覧"]["value"][step]["value"]["会員番号"]["value"];
                                                if (user_id === application_user_id) {
                                                    //一致しているときは返金処理を行う
                                                    bill_make(user_id, authory_id, use_date, "按分請求", ref_place, ref_amount);
                                                } else {
                                                    bill_make(user_id, authory_id, use_date, "按分請求", place, divide);
                                                }
                                                resolve();
                                            })
                                        }
                                        async function bill_m() {
                                            for (var i = 0; i < user_count; i++) {
                                                console.log(i + "回目")
                                                const res = await billmake(i);
                                                console.log(res);
                                            }
                                        }
                                        bill_m();
                                        var judge_dtl = "◆自動判定◆\n結果：OK\nカテゴリ:食料品＿規定額以内";
                                        return pause_auth(ev1, "登録済", "判定OK", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                            //成功
                                            console.log(data);
                                            //resolve(data);
                                            //resolve3(data);
                                            return data;
                                        }, function (e) {
                                            Swal.fire(e.er);
                                        })
                                    }
                                } else if (pay_category === "外食") {
                                    //20000円以上で保留
                                    if (amount >= 20000) {
                                        //保留
                                        return new kintone.Promise(function (resolve, reject) {
                                            Swal.fire({
                                                title: "審査保留(HO-AM-ST-2037)",
                                                html: 'この申請は保留となりました。<br>審査結果は数日中に更新されますのでお待ちください<br>場合によって確認をさせていただきますのでご了承ください<br><br>申請にはレシート(原本)が必要です。<br>レシート裏面に『<font color="red"><b>' + authory_id + '</b></font>』を記載の上ご提出ください。',
                                                icon: "warning"
                                            }).then(function () {
                                                var judge_dtl = "◆自動判定◆\n結果：保留\nカテゴリ:外食＿規定額以上";
                                                return pause_auth(ev1, "審査中", "判定保留(調査要)", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                                    //成功
                                                    console.log(data);
                                                    resolve(data);
                                                    //resolve3(data);
                                                    return data;
                                                }, function (e) {
                                                    Swal.fire(e.er);
                                                })
                                            })
                                        })
                                    } else {
                                        //続行
                                        //繰り返し処理が必要
                                        var user_id = "";
                                        var ref_place = "△返金△ " + place;
                                        var ref_amount = -divide * (user_count - 1);
                                        const billmake = (step) => {
                                            return new Promise(resolve => {
                                                //Promise処理をする内容を記載する
                                                /*
                                                bm_user_id -> 会員番号
                                                bm_authory_id -> 申請書番号
                                                bm_use_date -> 利用日
                                                bm_category -> 請求種別(按分請求・立替請求)
                                                bm_shop -> 加盟店名
                                                bm_amount -> 利用額
                                                */
                                                user_id = resp1.records["0"]["会員一覧"]["value"][step]["value"]["会員番号"]["value"];
                                                if (user_id === application_user_id) {
                                                    //一致しているときは返金処理を行う
                                                    bill_make(user_id, authory_id, use_date, "按分請求", ref_place, ref_amount);
                                                } else {
                                                    bill_make(user_id, authory_id, use_date, "按分請求", place, divide);
                                                }
                                                resolve();
                                            })
                                        }
                                        async function bill_m() {
                                            for (var i = 0; i < user_count; i++) {
                                                console.log(i + "回目")
                                                const res = await billmake(i);
                                                console.log(res);
                                            }
                                        }
                                        bill_m();
                                        var judge_dtl = "◆自動判定◆\n結果：OK\nカテゴリ:外食＿規定額以内";
                                        return pause_auth(ev1, "登録済", "判定OK", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                            //成功
                                            console.log(data);
                                            //resolve(data);
                                            //resolve3(data);
                                            return data;
                                        }, function (e) {
                                            Swal.fire(e.er);
                                        })
                                    }
                                } else if (pay_category === "賃料") {
                                    //20万以上で保留
                                    if (amount > 200000) {
                                        //保留
                                        //alert("保留")
                                        return new kintone.Promise(function (resolve, reject) {
                                            Swal.fire({
                                                title: "審査保留(HO-AM-ST-2037)",
                                                html: 'この申請は保留となりました。<br>審査結果は数日中に更新されますのでお待ちください<br>場合によって確認をさせていただきますのでご了承ください<br><br>申請にはレシート(原本)が必要です。<br>レシート裏面に『<font color="red"><b>' + authory_id + '</b></font>』を記載の上ご提出ください。',
                                                icon: "warning"
                                            }).then(function () {
                                                var judge_dtl = "◆自動判定◆\n結果：保留\nカテゴリ:賃料＿規定額以上";
                                                return pause_auth(ev1, "審査中", "判定保留(調査要)", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                                    //成功
                                                    console.log(data);
                                                    resolve(data);
                                                    //resolve3(data);
                                                    return data;
                                                }, function (e) {
                                                    Swal.fire(e.er);
                                                })
                                            })
                                        })
                                    } else {
                                        //alert("続行")
                                        //続行
                                        //繰り返し処理が必要
                                        var user_id = "";
                                        var ref_place = "△返金△ " + place;
                                        var ref_amount = -divide * (user_count - 1);
                                        const billmake = (step) => {
                                            return new Promise(resolve => {
                                                //Promise処理をする内容を記載する
                                                /*
                                                bm_user_id -> 会員番号
                                                bm_authory_id -> 申請書番号
                                                bm_use_date -> 利用日
                                                bm_category -> 請求種別(按分請求・立替請求)
                                                bm_shop -> 加盟店名
                                                bm_amount -> 利用額
                                                */
                                                user_id = resp1.records["0"]["会員一覧"]["value"][step]["value"]["会員番号"]["value"];
                                                if (user_id === application_user_id) {
                                                    //一致しているときは返金処理を行う
                                                    bill_make(user_id, authory_id, use_date, "按分請求", ref_place, ref_amount);
                                                } else {
                                                    bill_make(user_id, authory_id, use_date, "按分請求", place, divide);
                                                }
                                                resolve();
                                            })
                                        }
                                        async function bill_m() {
                                            for (var i = 0; i < user_count; i++) {
                                                console.log(i + "回目")
                                                const res = await billmake(i);
                                                console.log(res);
                                            }
                                        }
                                        bill_m();
                                        var judge_dtl = "◆自動判定◆\n結果：OK\nカテゴリ:賃料＿規定額以内";
                                        return pause_auth(ev1, "登録済", "判定OK", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                            //成功
                                            console.log(data);
                                            //resolve(data);
                                            //resolve3(data);
                                            return data;
                                        }, function (e) {
                                            Swal.fire(e.er);
                                        })
                                    }
                                } else if (pay_category === "電気・ガス・水道") {
                                    //20000円以上で保留
                                    if (amount >= 20000) {
                                        //保留
                                        return new kintone.Promise(function (resolve, reject) {
                                            Swal.fire({
                                                title: "審査保留(HO-AM-ST-2037)",
                                                html: 'この申請は保留となりました。<br>審査結果は数日中に更新されますのでお待ちください<br>場合によって確認をさせていただきますのでご了承ください<br><br>申請にはレシート(原本)が必要です。<br>レシート裏面に『<font color="red"><b>' + authory_id + '</b></font>』を記載の上ご提出ください。',
                                                icon: "warning"
                                            }).then(function () {
                                                var judge_dtl = "◆自動判定◆\n結果：保留\nカテゴリ:電気・ガス・水道＿規定額以上";
                                                return pause_auth(ev1, "審査中", "判定保留(調査要)", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                                    //成功
                                                    console.log(data);
                                                    resolve(data);
                                                    //resolve3(data);
                                                    return data;
                                                }, function (e) {
                                                    Swal.fire(e.er);
                                                })
                                            })
                                        })
                                    } else {
                                        //続行
                                        //繰り返し処理が必要
                                        var user_id = "";
                                        var ref_place = "△返金△ " + place;
                                        var ref_amount = -divide * (user_count - 1);
                                        const billmake = (step) => {
                                            return new Promise(resolve => {
                                                //Promise処理をする内容を記載する
                                                /*
                                                bm_user_id -> 会員番号
                                                bm_authory_id -> 申請書番号
                                                bm_use_date -> 利用日
                                                bm_category -> 請求種別(按分請求・立替請求)
                                                bm_shop -> 加盟店名
                                                bm_amount -> 利用額
                                                */
                                                user_id = resp1.records["0"]["会員一覧"]["value"][step]["value"]["会員番号"]["value"];
                                                if (user_id === application_user_id) {
                                                    //一致しているときは返金処理を行う
                                                    bill_make(user_id, authory_id, use_date, "按分請求", ref_place, ref_amount);
                                                } else {
                                                    bill_make(user_id, authory_id, use_date, "按分請求", place, divide);
                                                }
                                                resolve();
                                            })
                                        }
                                        async function bill_m() {
                                            for (var i = 0; i < user_count; i++) {
                                                console.log(i + "回目")
                                                const res = await billmake(i);
                                                console.log(res);
                                            }
                                        }
                                        bill_m();
                                        var judge_dtl = "◆自動判定◆\n結果：OK\nカテゴリ:電気・ガス・水道＿規定額以内";
                                        return pause_auth(ev1, "登録済", "判定OK", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                            //成功
                                            console.log(data);
                                            //resolve(data);
                                            //resolve3(data);
                                            return data;
                                        }, function (e) {
                                            swal(e.er);
                                        })
                                    }
                                } else if (pay_category === "回線") {
                                    //30000円以上で保留
                                    if (amount >= 3000) {
                                        //保留
                                        return new kintone.Promise(function (resolve, reject) {
                                            Swal.fire({
                                                title: "審査保留(HO-AM-ST-2037)",
                                                html: 'この申請は保留となりました。<br>審査結果は数日中に更新されますのでお待ちください<br>場合によって確認をさせていただきますのでご了承ください<br><br>申請にはレシート(原本)が必要です。<br>レシート裏面に『<font color="red"><b>' + authory_id + '</b></font>』を記載の上ご提出ください。',
                                                icon: "warning"
                                            }).then(function () {
                                                var judge_dtl = "◆自動判定◆\n結果：保留\nカテゴリ:回線使用料＿規定額以上";
                                                return pause_auth(ev1, "審査中", "判定保留(調査要)", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                                    //成功
                                                    console.log(data);
                                                    resolve(data);
                                                    //resolve3(data);
                                                    return data;
                                                }, function (e) {
                                                    Swal.fire(e.er);
                                                })
                                            })
                                        })
                                    } else {
                                        //続行
                                        //繰り返し処理が必要
                                        var user_id = "";
                                        var ref_place = "△返金△ " + place;
                                        var ref_amount = -divide * (user_count - 1);
                                        const billmake = (step) => {
                                            return new Promise(resolve => {
                                                //Promise処理をする内容を記載する
                                                /*
                                                bm_user_id -> 会員番号
                                                bm_authory_id -> 申請書番号
                                                bm_use_date -> 利用日
                                                bm_category -> 請求種別(按分請求・立替請求)
                                                bm_shop -> 加盟店名
                                                bm_amount -> 利用額
                                                */
                                                user_id = resp1.records["0"]["会員一覧"]["value"][step]["value"]["会員番号"]["value"];
                                                if (user_id === application_user_id) {
                                                    //一致しているときは返金処理を行う
                                                    bill_make(user_id, authory_id, use_date, "按分請求", ref_place, ref_amount);
                                                } else {
                                                    bill_make(user_id, authory_id, use_date, "按分請求", place, divide);
                                                }
                                                resolve();
                                            })
                                        }
                                        async function bill_m() {
                                            for (var i = 0; i < user_count; i++) {
                                                console.log(i + "回目")
                                                const res = await billmake(i);
                                                console.log(res);
                                            }
                                        }
                                        bill_m();
                                        var judge_dtl = "◆自動判定◆\n結果：OK\nカテゴリ:回線料金＿規定額以内";
                                        return pause_auth(ev1, "登録済", "判定OK", judge_dtl, application_user_id, group_id, divide, user_count).then(function (data) {
                                            //成功
                                            console.log(data);
                                            //resolve(data);
                                            //resolve3(data);
                                            return data;
                                        }, function (e) {
                                            Swal.fire(e.er);
                                        })
                                    }
                                } else if (pay_category === "保険料・税") {
                                    //一律エラー
                                    return new kintone.Promise(function (resolve4, reject4) {
                                        Swal.fire({
                                            title: "入力エラー(CA-SL-20)",
                                            html: "組み合わせエラーです。<br>申請内容をご確認ください。",
                                            icon: "error"
                                        })
                                        resolve3(false);
                                        resolve4(false);

                                    })
                                } else if (pay_category === "手数料等") {
                                    //一律エラー
                                    return new kintone.Promise(function (resolve4, reject4) {
                                        Swal.fire({
                                            title: "入力エラー(CA-SL-20)",
                                            html: "組み合わせエラーです。<br>申請内容をご確認ください。",
                                            icon: "error"
                                        })
                                        resolve3(false);
                                        resolve4(false);
                                    })
                                } else {
                                    //エラー（未選択)
                                    return new kintone.Promise(function (resolve4, reject4) {
                                        Swal.fire({
                                            title: "入力エラー(CA-SL-50)",
                                            html: "カテゴリーが選択されていません。",
                                            icon: "error"
                                        })
                                        resolve3(false);
                                        resolve4(false);
                                    })
                                }
                                //resolve3();
                            }
                        }).then(function (data) {
                            //登録成功プロンプト
                            return new kintone.Promise(function (resolve4a, reject4a) {
                                //swal
                                Swal.fire({
                                    title: "登録完了(CA-CP-00)",
                                    html: "登録処理が完了しました",
                                    icon: "success"
                                }).then(function () {
                                    resolve4a(data);
                                    resolve3(data);
                                })
                            })
                        })
                    })
                })
            }
        } else if (category === "請求申請") {
            //請求申請の処理
            var billing_id = ev1.record['請求先ID'].value;
            if (!billing_id) {
                return new kintone.Promise(function (resolve5, reject5) {
                    Swal.fire({
                        title: "入力エラー(CA-BT-48)",
                        html: "請求先IDが入力されていないか存在しません",
                        icon: "error"
                    })
                    return resolve5(false);
                })
            } else {
                //処理続行
                /*
                var category = ev1.record['申請項目'].value;
                var application_user_id = ev1.record['申請者ID'].value;
                var use_date = ev1.record['利用日'].value;
                var amount = ev1.record['按分対象額'].value;
                var place = ev1.record['加盟店名'].value;
                var authory_id = ev1.record['管理番号'].value;
                var pay_category = ev1.record['購入カテゴリ'].value;
                */
                return new kintone.Promise(function (resolve, reject) {
                    Swal.fire({
                        title: "審査保留(HO-AM-ST-1001)",
                        html: 'この申請は保留となりました。<br>審査結果は数日中に更新されますのでお待ちください<br>場合によって確認をさせていただきますのでご了承ください<br><br>申請にはレシート(原本)が必要です。<br>レシート裏面に『<font color="red"><b>' + authory_id + '</b></font>』を記載の上ご提出ください。',
                        icon: "warning"
                    }).then(function () {
                        var judge_dtl = "◆自動判定◆\n結果：保留\nカテゴリ:個人請求";
                        return pause_auth_kojin(ev1, "審査中", "判定保留(調査要)", judge_dtl, application_user_id, billing_id, amount).then(function (data) {
                            //成功
                            console.log(data);
                            //resolve(data);
                            //resolve3(data);
                            return data;
                        }, function (e) {
                            Swal.fire(e.er);
                        })
                    }).then(function (data) {
                        //登録成功プロンプト
                        return new kintone.Promise(function (resolve4a, reject4a) {
                            //swal
                            Swal.fire({
                                title: "登録完了(CA-CP-00)",
                                html: "登録処理が完了しました",
                                icon: "success"
                            }).then(function () {
                                resolve4a(data);
                                resolve(data);
                            })
                        })
                    })
                })
            }
        }
    })

    kintone.events.on('app.record.create.show', function (ev3) {
        //フィールドを非活性にする
        var record = ev3.record;
        var min = 10000000000;
        var max = 99999999999;
        var a = Math.floor(Math.random() * (max + 1 - min)) + min;
        var flags = false;

        var query = {
            "app": kintone.app.getId(),
            "query": '管理番号="' + a + '"'
        }

        const regen = (event) => {
            return new Promise(resolve => {
                var record = event.record;
                var min = 10000000000;
                var max = 99999999999;
                var a = Math.floor(Math.random() * (max + 1 - min)) + min;

                var query = {
                    "app": kintone.app.getId(),
                    "query": '管理番号="' + a + '"'
                }

                return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', query).then(function (resp_regen) {
                    //成功
                    var rec_rg = resp_regen.records;
                    if (rec_rg.length > 0) {
                        //存在
                        flags = false;
                        resolve();
                        return true
                    } else {
                        flags = true;
                        resolve();
                        return true;
                    }
                })
            })

        }

        return kintone.api(kintone.api.url('/k/v1/records.json', true), 'GET', query).then(function (resp) {
            var records = resp.records;
            if (records.length > 0) {
                //レコード存在
                async function regen() {
                    while (flags === true) {
                        //trueになるまでやり続ける
                        await regen(ev3);
                    }
                }
                regen();
                //record['管理番号'].disabled = false;
                ev3.record['管理番号'].value = a;
                record['管理番号'].disabled = true;
                record['按分グループID'].disabled = false;
                record['請求先ID'].disabled = true;
                record['申請ステータス'].disabled = true;
                record['請求額_1人当たり'].disabled = true;
                record['事前判定結果'].disabled = true;
                record['判定結果詳細'].disabled = true;
                record['申請者名義'].disabled = true;
                record['請求先名義'].disabled = true;
                record['按分人数'].disabled = true;
                record['差戻理由'].disabled = true;
                var invisible_field = [
                    '事前判定結果',
                    '判定結果詳細',
                    '申請者名義',
                    '請求先名義',
                    '按分人数',
                    '請求額_1人当たり'
                ];
        
                $.each(invisible_field, function (i, val) {
                    kintone.app.record.setFieldShown(val, false);
                })
                return ev3;
            } else {
                //record['管理番号'].disabled = false;
                ev3.record['管理番号'].value = a;
                record['管理番号'].disabled = true;
                record['按分グループID'].disabled = false;
                record['請求先ID'].disabled = true;
                record['申請ステータス'].disabled = true;
                record['請求額_1人当たり'].disabled = true;
                record['事前判定結果'].disabled = true;
                record['判定結果詳細'].disabled = true;
                record['申請者名義'].disabled = true;
                record['請求先名義'].disabled = true;
                record['按分人数'].disabled = true;
                record['差戻理由'].disabled = true;
                var invisible_field = [
                    '事前判定結果',
                    '判定結果詳細',
                    '申請者名義',
                    '請求先名義',
                    '按分人数',
                    '請求額_1人当たり'
                ];
        
                $.each(invisible_field, function (i, val) {
                    kintone.app.record.setFieldShown(val, false);
                })
            }
            return ev3;
        }).catch(function (e) {
            Swal.fire({
                title: "APIエラー (" + e.code + ")",
                html: "kintone API処理中にエラーが起きました。\n" + e.message + "\n\nCybozu問合用ID: " + e.id,
                icon: "error",
            })
            //alert("API処理中にエラーが発生しました。 - error: "+e.message);
            return false;
        });
    })

    kintone.events.on('app.record.edit.show', function (event) {
        var record = event.record;
        //フィールドを非活性にする
        if (record['申請ステータス'].value === "調査中") {
            record['判定結果詳細'].disabled = false;
            record['申請ステータス'].disabled = false;
        } else {
            record['判定結果詳細'].disabled = true;
            record['申請ステータス'].disabled = true;
        }
        record['管理番号'].disabled = true;
        record['按分グループID'].disabled = false;
        record['請求先ID'].disabled = true;
        record['請求額_1人当たり'].disabled = true;
        record['事前判定結果'].disabled = true;
        record['申請者名義'].disabled = true;
        record['請求先名義'].disabled = true;
        record['按分人数'].disabled = true;
        record['差戻理由'].disabled = true;
        var invisible_field = [
            '事前判定結果',
            '判定結果詳細',
            '申請者名義',
            '請求先名義',
            '按分人数',
            '請求額_1人当たり'
        ];

        $.each(invisible_field, function (i, val) {
            kintone.app.record.setFieldShown(val, false);
        })
        return event;
    });

    kintone.events.on('app.record.index.show', function (ev) {
        //DOM操作（非推奨のため、今後動作しない場合は別の対策が必要
        $(".recordlist-edit-icon-gaia").hide();
        $(".recordlist-remove-gaia").hide();
    })
})();