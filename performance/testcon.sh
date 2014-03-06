base=$1
for f in 0 1 3 10 30 100 300 1000 3000 10000
do
  url="${base}${f}"
  for c in 0 1 2 3 4 5 10 15 20 25
    i=0
    while [ $i -lt 20 ]
    do
      pids=""
      pi=0
      while [ $pi -lt $c ]
      do
        curl -so /dev/null $url &
        pids="$pids $!"
        pi=`expr $pi + 1`
      done
      t=`curl -so /dev/null -w '%{time_total}\n' $url`
      echo "$f $c $t $i $url"
      echo "$f $c $t $i $url" >> testcon.log
      for pid in $pids
      do
        wait $pid
      done
      i=`expr $i + 1`
    done
  done
done

