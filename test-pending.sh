curl -X GET "http://localhost:3000/youtube/WEb-TmacK-c/info/formats?type=video&height=1080" | python3 -m json.tool
for i in {1..1}; do
    curl -X POST "http://localhost:3000/youtube/pending" -H "Content-Type: application/json" -d '{"videoId": "WEb-TmacK-c", "itag": 137}' | python3 -m json.tool
done
