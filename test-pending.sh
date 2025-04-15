for i in {1..7}; do
    curl -X GET localhost:3000/youtube/WEb-TmacK-c/pending/137 | python3 -m json.tool
done
