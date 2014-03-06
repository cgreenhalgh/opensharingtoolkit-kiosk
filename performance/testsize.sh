base=$1
for f in 0 1 3 10 30 100 300 1000 3000 10000
do
  url="${base}${f}"
  i=0
  while [ $i -lt 20 ]
  do
    t=`curl -so /dev/null -w '%{time_total}\n' $url`
    echo "$f $t $i $url"
    echo "$f $t $i $url" >> testsize.log
    i=`expr $i + 1`
  done
done

