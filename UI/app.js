Dropzone.autoDiscover = false;

const playerMeta = {
    "cristiano_ronaldo": { name: "Cristiano Ronaldo", img: "./images/ronaldo.jpg" },
    "erling_haaland":    { name: "Erling Haaland",    img: "./images/haaland.jpg" },
    "kylian_mbappe":     { name: "Kylian Mbapp\u00e9", img: "./images/mbappe.jpg" },
    "lionel_messi":      { name: "Lionel Messi",       img: "./images/messi.jpg" }
};

function init() {
    let dz = new Dropzone("#dropzone", {
        url: "/",
        maxFiles: 1,
        addRemoveLinks: true,
        dictDefaultMessage: "",
        autoProcessQueue: false
    });

    dz.on("addedfile", function () {
        if (dz.files[1] != null) {
            dz.removeFile(dz.files[0]);
        }
    });

    dz.on("complete", function (file) {
        let url = "http://127.0.0.1:5000/classify_image";

        $.post(url, {
            image_data: file.dataURL
        }, function (data, status) {

            console.log(data);
            if (!data || data.length == 0) {
                $("#result").hide();
                $("#error").show();
                return;
            }

            let match = null;
            let bestScore = -1;
            for (let i = 0; i < data.length; ++i) {
                let maxScoreForThisClass = Math.max(...data[i].class_probability);
                if (maxScoreForThisClass > bestScore) {
                    match = data[i];
                    bestScore = maxScoreForThisClass;
                }
            }

            if (match) {
                $("#error").hide();

                let meta = playerMeta[match.class] || { name: match.class, img: "" };
                $("#result-img").attr("src", meta.img).attr("alt", meta.name);
                $("#result-name").text(meta.name);
                $("#result-conf").text(Math.round(bestScore) + "% confidence");

                let classDictionary = match.class_dictionary;
                let rows = Object.keys(classDictionary).map(function (personName) {
                    let index = classDictionary[personName];
                    let score = match.class_probability[index];
                    return { key: personName, score: score };
                });
                rows.sort(function (a, b) { return b.score - a.score; });

                let barsHtml = rows.map(function (row, i) {
                    let meta = playerMeta[row.key] || { name: row.key };
                    let pct = Math.max(0, Math.min(100, Math.round(row.score)));
                    let leadClass = i === 0 ? " lead" : "";
                    return (
                        '<div class="bar-row">' +
                            '<div class="bar-name">' + meta.name.split(" ").pop() + '</div>' +
                            '<div class="bar-track"><div class="bar-fill' + leadClass + '" style="width:' + pct + '%"></div></div>' +
                            '<div class="bar-pct">' + pct + '%</div>' +
                        '</div>'
                    );
                }).join("");
                $("#bars").html(barsHtml);

                $("#result").show();
            }
        });
    });

    $("#submitBtn").on('click', function () {
        dz.processQueue();
    });
}

$(document).ready(function () {
    $("#error").hide();
    $("#result").hide();
    init();
});
