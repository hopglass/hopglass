define(["chroma-js", "moment", "tablesort", "helper", "moment.de"],
  function (chroma, moment, Tablesort, helper) {
    "use strict";

    function showGeoURI(d) {
      function showLatitude(d) {
        var suffix = Math.sign(d) > -1 ? "' N" : "' S";
        d = Math.abs(d);
        var a = Math.floor(d);
        var min = (d * 60) % 60;
        a = (a < 10 ? "0" : "") + a;

        return a + "° " + min.toFixed(3) + suffix;
      }

      function showLongitude(d) {
        var suffix = Math.sign(d) > -1 ? "' E" : "' W";
        d = Math.abs(d);
        var a = Math.floor(d);
        var min = (d * 60) % 60;
        a = (a < 100 ? "0" + (a < 10 ? "0" : "") : "") + a;

        return a + "° " + min.toFixed(3) + suffix;
      }

      if (!helper.hasLocation(d)) {
        return undefined;
      }

      return function (el) {
        var latitude = d.nodeinfo.location.latitude;
        var longitude = d.nodeinfo.location.longitude;
        var a = document.createElement("a");
        a.textContent = showLatitude(latitude) + " " +
          showLongitude(longitude);

        a.href = "geo:" + latitude + "," + longitude;
        el.appendChild(a);
      };
    }

    function showStatus(d) {
      return function (el) {
        el.classList.add(d.flags.unseen ? "unseen" : (d.flags.online ? "online" : "offline"));
        if (d.flags.online) {
          el.textContent = "online, letzte Nachricht " + d.lastseen.fromNow() + " (" + d.lastseen.format("DD.MM.YYYY,  H:mm:ss") + ")";
        } else {
          el.textContent = "offline, letzte Nachricht " + d.lastseen.fromNow() + " (" + d.lastseen.format("DD.MM.YYYY,  H:mm:ss") + ")";
        }
      };
    }

    function showFirmware(d) {
      var release = helper.dictGet(d.nodeinfo, ["software", "firmware", "release"]);
      var base = helper.dictGet(d.nodeinfo, ["software", "firmware", "base"]);

      if (release === null || base === null) {
        return undefined;
      }

      return release + " / " + base;
    }

    function showSite(d, config) {
      var site = helper.dictGet(d.nodeinfo, ["system", "site_code"]);
      var rt = site;
      if (config.siteNames) {
        config.siteNames.forEach(function (t) {
          if (site === t.site) {
            rt = t.name;
          }
        });
      }
      return rt;
    }

    function showUptime(d) {
      if (!("uptime" in d.statistics)) {
        return undefined;
      }

      return moment.duration(d.statistics.uptime, "seconds").humanize();
    }

    function showFirstseen(d) {
      if (!("firstseen" in d)) {
        return undefined;
      }

      return d.firstseen.fromNow(true);
    }

    function wifiChannelAlias(ch) {
      var chlist = {
        "1": "2412 MHz",
        "2": "2417 MHz",
        "3": "2422 MHz",
        "4": "2427 MHz",
        "5": "2432 MHz",
        "6": "2437 MHz",
        "7": "2442 MHz",
        "8": "2447 MHz",
        "9": "2452 MHz",
        "10": "2457 MHz",
        "11": "2462 MHz",
        "12": "2467 MHz",
        "13": "2472 MHz",
        "36": "5180 MHz (Indoors)",
        "40": "5200 MHz (Indoors)",
        "44": "5220 MHz (Indoors)",
        "48": "5240 MHz (Indoors)",
        "52": "5260 MHz (Indoors/DFS/TPC)",
        "56": "5280 MHz (Indoors/DFS/TPC)",
        "60": "5300 MHz (Indoors/DFS/TPC)",
        "64": "5320 MHz (Indoors/DFS/TPC)",
        "100": "5500 MHz (DFS) !!",
        "104": "5520 MHz (DFS) !!",
        "108": "5540 MHz (DFS) !!",
        "112": "5560 MHz (DFS) !!",
        "116": "5580 MHz (DFS) !!",
        "120": "5600 MHz (DFS) !!",
        "124": "5620 MHz (DFS) !!",
        "128": "5640 MHz (DFS) !!",
        "132": "5660 MHz (DFS) !!",
        "136": "5680 MHz (DFS) !!",
        "140": "5700 MHz (DFS) !!"
      };
      if (!(ch in chlist)) {
        return "";
      } else {
        return chlist[ch];
      }
    }

    function showWifiChannel(ch) {
      if (!ch) {
        return undefined;
      }

      return ch + " (" + wifiChannelAlias(ch) + ")";
    }

    function showClients(d) {
      if (!d.flags.online) {
        return undefined;
      }

      var meshclients = getMeshClients(d);
      resetMeshClients(d);
      var before = "     (";
      var after = " in der lokalen Wolke)";
      return function (el) {
        el.appendChild(document.createTextNode(d.statistics.clients > 0 ? d.statistics.clients : "keine"));
        el.appendChild(document.createTextNode(before));
        el.appendChild(document.createTextNode(meshclients > 0 ? meshclients : "keine"));
        el.appendChild(document.createTextNode(after));
        el.appendChild(document.createElement("br"));

        var span = document.createElement("span");
        span.classList.add("clients");
        span.innerHTML = "<i class=\"ion-ios-person\"></i>".repeat(d.statistics.clients);
        el.appendChild(span);

        var spanmesh = document.createElement("span");
        spanmesh.classList.add("clientsMesh");
        spanmesh.textContent = "\uF47E ".repeat(meshclients - d.statistics.clients);
        el.appendChild(spanmesh);
      };
    }

    function getMeshClients(node) {
      var meshclients = 0;
      if (node.statistics && !isNaN(node.statistics.clients)) {
        meshclients = node.statistics.clients;
      }

      if (!node) {
        return 0;
      }

      if (node.parsed) {
        return 0;
      }

      node.parsed = 1;
      node.neighbours.forEach(function (neighbour) {
        if (!neighbour.link.isVPN && neighbour.node) {
          meshclients += getMeshClients(neighbour.node);
        }
      });

      return meshclients;
    }

    function resetMeshClients(node) {
      if (!node.parsed) {
        return;
      }

      node.parsed = 0;

      node.neighbours.forEach(function (neighbour) {
        if (!neighbour.link.isVPN && neighbour.node) {
          resetMeshClients(neighbour.node);
        }
      });


    }

    function showMeshClients(d) {
      if (!d.flags.online) {
        return undefined;
      }

      var meshclients = getMeshClients(d);
      resetMeshClients(d);
      return function (el) {
        el.appendChild(document.createTextNode(meshclients > 0 ? meshclients : "keine"));
        el.appendChild(document.createElement("br"));
      };
    }

    function showIPs(d) {
      var ips = helper.dictGet(d.nodeinfo, ["network", "addresses"]);
      if (ips === null) {
        return undefined;
      }

      ips.sort();

      return function (el) {
        ips.forEach(function (ip, i) {
          var link = !ip.startsWith("fe80:");

          if (i > 0) {
            el.appendChild(document.createElement("br"));
          }

          if (link) {
            var a = document.createElement("a");
            if (ip.includes(".")) {
              a.href = "http://" + ip + "/";
            } else {
              a.href = "http://[" + ip + "]/";
            }
            a.textContent = ip;
            el.appendChild(a);
          } else {
            el.appendChild(document.createTextNode(ip));
          }
        });
      };
    }

    function showBar(className, v) {
      var span = document.createElement("span");
      span.classList.add("bar", className);

      var bar = document.createElement("span");
      bar.style.width = (v * 100) + "%";
      span.appendChild(bar);

      var label = document.createElement("label");
      label.textContent = (Math.round(v * 100)) + " %";
      span.appendChild(label);

      return span;
    }

    function showLoadBar(className, v) {
      var span = document.createElement("span");
      span.classList.add("bar", className);

      var bar = document.createElement("span");
      if (v >= 1) {
        bar.style.width = ((v * 100) % 100) + "%";
        bar.style.background = "rgba(255, 50, 50, 0.9)";
        span.style.background = "rgba(255, 50, 50, 0.6)";
        span.appendChild(bar);
      }
      else {
        bar.style.width = (v * 100) + "%";
        span.appendChild(bar);
      }

      var label = document.createElement("label");
      label.textContent = +(Math.round(v + "e+2") + "e-2");
      span.appendChild(label);

      return span;
    }

    function showLoad(d) {
      if (!("loadavg" in d.statistics)) {
        return undefined;
      }

      return function (el) {
        el.appendChild(showLoadBar("load-avg", d.statistics.loadavg.toFixed(2)));
      };
    }

    function showRAM(d) {
      if (!("memory_usage" in d.statistics)) {
        return undefined;
      }

      return function (el) {
        el.appendChild(showBar("memory-usage", d.statistics.memory_usage));
      };
    }

    function showAirtime(band, val) {
      if (!val) {
        return undefined;
      }

      return function (el) {
        el.appendChild(showBar("airtime" + band.toString(), val));
      };
    }

    function createLink(target, router) {
      if (!target) {
        return document.createTextNode("unknown");
      }
      var unknown = !(target.node);
      var text = unknown ? (target.id ? target.id : target) : target.node.nodeinfo.hostname;
      if (!unknown) {
        var link = document.createElement("a");
        link.classList.add("hostname-link");
        link.href = "#";
        link.onclick = router.node(target.node);
        link.textContent = text;
        return link;
      }
      return document.createTextNode(text);
    }

    function showGateway(d, router) {
      var nh;
      if (helper.dictGet(d.statistics, ["nexthop"])) {
        nh = helper.dictGet(d.statistics, ["nexthop"]);
      }
      if (helper.dictGet(d.statistics, ["gateway_nexthop"])) {
        nh = helper.dictGet(d.statistics, ["gateway_nexthop"]);
      }
      var gw = helper.dictGet(d.statistics, ["gateway"]);

      if (!gw) {
        return null;
      }
      return function (el) {
        var num = 0;
        while (gw && nh && gw.id !== nh.id && num < 10) {
          if (num !== 0) {
            el.appendChild(document.createTextNode(" -> "));
          }
          el.appendChild(createLink(nh, router));
          num++;
          if (!nh.node || !nh.node.statistics) {
            break;
          }
          if (!helper.dictGet(nh.node.statistics, ["gateway"]) || !helper.dictGet(nh.node.statistics, ["gateway"]).id) {
            break;
          }
          if (helper.dictGet(nh.node.statistics, ["gateway"]).id !== gw.id) {
            break;
          }
          if (helper.dictGet(nh.node.statistics, ["gateway_nexthop"])) {
            nh = helper.dictGet(nh.node.statistics, ["gateway_nexthop"]);
          } else if (helper.dictGet(nh.node.statistics, ["nexthop"])) {
            nh = helper.dictGet(nh.node.statistics, ["nexthop"]);
          } else {
            break;
          }
        }
        if (gw && nh && gw.id !== nh.id) {
          if (num !== 0) {
            el.appendChild(document.createTextNode(" -> "));
          }
          num++;
          el.appendChild(document.createTextNode("..."));
        }
        if (num !== 0) {
          el.appendChild(document.createTextNode(" -> "));
        }
        el.appendChild(createLink(gw, router));
      };
    }

    function showPages(d) {
      var webpages = helper.dictGet(d.nodeinfo, ["pages"]);
      if (webpages === null) {
        return undefined;
      }

      webpages.sort();

      return function (el) {
        webpages.forEach(function (webpage, i) {
          if (i > 0) {
            el.appendChild(document.createElement("br"));
          }

          var a = document.createElement("span");
          var link = document.createElement("a");
          link.href = webpage;
          if (webpage.search(/^https:\/\//i) !== -1) {
            var lock = document.createElement("span");
            lock.classList.add("ion-android-lock");
            a.appendChild(lock);
            var t1 = document.createTextNode(" ");
            a.appendChild(t1);
            link.textContent = webpage.replace(/^https:\/\//i, "");
          }
          else {
            link.textContent = webpage.replace(/^http:\/\//i, "");
          }
          a.appendChild(link);
          el.appendChild(a);
        });
      };
    }

    function showAutoupdate(d) {
      var au = helper.dictGet(d.nodeinfo, ["software", "autoupdater"]);
      if (!au) {
        return undefined;
      }

      return au.enabled ? "aktiviert (" + au.branch + ")" : "deaktiviert";
    }

    function showNodeImg(o, model) {
      if (!model) {
        return document.createTextNode("Knotenname");
      }

      var content, caption;
      var modelhash = model.split("").reduce(function (a, b) {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);

      content = document.createElement("img");
      content.id = "routerpicture";
      content.classList.add("nodeImg");
      content.src = o.thumbnail.replace("{MODELHASH}", modelhash);
      content.onerror = function () {
        document.getElementById("routerpicdiv").outerHTML = "Knotenname";
      };

      if (o.caption) {
        caption = o.caption.replace("{MODELHASH}", modelhash);

        if (!content) {
          content = document.createTextNode(caption);
        }
      }

      var p = document.createElement("p");
      p.appendChild(content);

      return content;
    }

    function showStatImg(o, d) {
      var subst = {};
      subst["{NODE_ID}"] = d.nodeinfo.node_id ? d.nodeinfo.node_id : "unknown";
      subst["{NODE_NAME}"] = d.nodeinfo.hostname ? d.nodeinfo.hostname.replace(/[^a-z0-9\-]/ig, "_") : "unknown";
      return helper.showStat(o, subst);
    }

    return function (config, el, router, d) {
      var linkScale = chroma.scale(chroma.bezier(["#04C714", "#FF5500", "#F02311"])).domain([1, 5]);
      var h2 = document.createElement("h2");
      h2.textContent = d.nodeinfo.hostname;
      el.appendChild(h2);

      var attributes = document.createElement("table");
      attributes.classList.add("attributes");

      if (config.hwImg) {
        var top = document.createElement("div");
        top.id = "routerpicdiv";
        try {
          config.hwImg.forEach(function (hwImg) {
            try {
              top.appendChild(showNodeImg(hwImg, helper.dictGet(d, ["nodeinfo", "hardware", "model"])));
            } catch (err) {
              console.warn(err.message);
            }
          });
        } catch (err) {
          console.warn(err.message);
        }
        helper.attributeEntry(attributes, top, d.nodeinfo.hostname);
      } else {
        var heading = document.createElement("h2");
        heading.textContent = d.nodeinfo.hostname;
        el.appendChild(heading);
      }

      helper.attributeEntry(attributes, "Status", showStatus(d));
      helper.attributeEntry(attributes, "Gateway", d.flags.gateway ? "ja" : null);
      helper.attributeEntry(attributes, "Koordinaten", showGeoURI(d));

      if (config.showContact) {
        helper.attributeEntry(attributes, "Kontakt", helper.dictGet(d.nodeinfo, ["owner", "contact"]));
      }

      helper.attributeEntry(attributes, "Hardware", helper.dictGet(d.nodeinfo, ["hardware", "model"]));
      helper.attributeEntry(attributes, "Primäre MAC", helper.dictGet(d.nodeinfo, ["network", "mac"]));
      helper.attributeEntry(attributes, "Node ID", helper.dictGet(d.nodeinfo, ["node_id"]));
      helper.attributeEntry(attributes, "Firmware", showFirmware(d));
      helper.attributeEntry(attributes, "Site", showSite(d, config));
      helper.attributeEntry(attributes, "Uptime", showUptime(d));
      helper.attributeEntry(attributes, "Teil des Netzes", showFirstseen(d));
      helper.attributeEntry(attributes, "Kanal 2.4 GHz", showWifiChannel(helper.dictGet(d.nodeinfo, ["wireless", "chan2"])));
      helper.attributeEntry(attributes, "Kanal 5 GHz", showWifiChannel(helper.dictGet(d.nodeinfo, ["wireless", "chan5"])));
      helper.attributeEntry(attributes, "Airtime 2.4 GHz", showAirtime(2, helper.dictGet(d.statistics, ["wireless", "airtime2"])));
      helper.attributeEntry(attributes, "Airtime 5 GHz", showAirtime(5, helper.dictGet(d.statistics, ["wireless", "airtime5"])));
      helper.attributeEntry(attributes, "Systemlast", showLoad(d));
      helper.attributeEntry(attributes, "Arbeitsspeicher", showRAM(d));
      helper.attributeEntry(attributes, "IP Adressen", showIPs(d));
      helper.attributeEntry(attributes, "Webseite", showPages(d));
      helper.attributeEntry(attributes, "Gewähltes Gateway", showGateway(d, router));
      helper.attributeEntry(attributes, "Autom. Updates", showAutoupdate(d));
      helper.attributeEntry(attributes, "Clients", showClients(d), showMeshClients(d));

      el.appendChild(attributes);


      if (config.nodeInfos) {
        config.nodeInfos.forEach(function (nodeInfo) {
          var h4 = document.createElement("h4");
          h4.textContent = nodeInfo.name;
          el.appendChild(h4);
          el.appendChild(showStatImg(nodeInfo, d));
        });
      }

      if (d.neighbours.length > 0) {
        var h3 = document.createElement("h3");
        h3.textContent = "Links (" + d.neighbours.length + ")";
        el.appendChild(h3);

        var table = document.createElement("table");
        var thead = document.createElement("thead");

        var tr = document.createElement("tr");
        var th1 = document.createElement("th");
        th1.textContent = " ";
        tr.appendChild(th1);

        var th2 = document.createElement("th");
        th2.textContent = "Knoten";
        th2.classList.add("sort-default");
        tr.appendChild(th2);

        var th3 = document.createElement("th");
        th3.textContent = "TQ";
        tr.appendChild(th3);

        var th4 = document.createElement("th");
        th4.textContent = "Typ";
        tr.appendChild(th4);

        var th5 = document.createElement("th");
        th5.textContent = "Entfernung";
        tr.appendChild(th5);

        thead.appendChild(tr);
        table.appendChild(thead);

        var tbody = document.createElement("tbody");

        d.neighbours.forEach(function (d) {
          var unknown = !(d.node);
          var tr = document.createElement("tr");

          var td1 = document.createElement("td");

          var direction = document.createElement("span");
          direction.classList.add(d.incoming ? "ion-ios-arrow-thin-left" : "ion-ios-arrow-thin-right");
          td1.appendChild(direction);

          if (!unknown && helper.hasLocation(d.node)) {
            var span = document.createElement("span");
            span.classList.add("icon", "ion-location");
            td1.appendChild(span);
          }

          tr.appendChild(td1);

          var td2 = document.createElement("td");
          var a1 = document.createElement("a");
          a1.classList.add("hostname", d.link.target.node.flags.online ? "online" : "unseen");
          a1.textContent = unknown ? d.id : d.node.nodeinfo.hostname;
          if (!unknown) {
            a1.href = "#";
          }
          a1.onclick = router.node(d.node);
          td2.appendChild(a1);

          tr.appendChild(td2);

          var td3 = document.createElement("td");
          td3.textContent = helper.showTq(d.link);
          td3.style.color = linkScale(d.link.tq).hex();
          tr.appendChild(td3);

          var td4 = document.createElement("td");
          var a3 = document.createElement("a");
          a3.href = "#";
          a3.textContent = d.link.type;
          a3.onclick = router.link(d.link);
          td4.appendChild(a3);
          tr.appendChild(td4);

          var td5 = document.createElement("td");
          td5.textContent = helper.showDistance(d.link);
          td5.setAttribute("data-sort", d.link.distance !== undefined ? -d.link.distance : 1);
          tr.appendChild(td5);

          tbody.appendChild(tr);
        });

        table.appendChild(tbody);
        table.classList.add("node-links");

        Tablesort(table);

        el.appendChild(table);
      }
    };
  });
