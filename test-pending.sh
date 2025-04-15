for i in {1..5}; do
    curl -X POST localhost:3000/youtube/pending \
        -H "Content-Type: application/json" \
        -d '{"videoId": "WEb-TmacK-c", "itag": 137}' | python3 -m json.tool
done
