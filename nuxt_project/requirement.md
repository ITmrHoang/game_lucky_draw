Xây dựng hệ thống quay số trúng thưởng cho các mã số dự  thưởng tặng cho khách hàng
- một khách hàng có thể có nhiều mã code ( mã dự thưởng được tặng)
- sẽ có các kỳ quay số khác nhau cấu hình các giải thưởng, mỗi kỳ quay số sẽ có các giải thưởng khác nhau, mỗi giải có thể có một hoặc nhiều người trúng
- hệ thống cho phép cài đặt người sẽ trúng giải của giải đó, theo số lượng người trúng giải tương ứng để cài đặt, nếu cài không tới số lượng người trúng giải với số giải thì xuất đó sẽ ramdom người số ngẫu nhiên
- Cho phép cài đặt giải đó ramdom hoặc cài đặt trúng giải như trên, cho phép cài đặt một người chỉ được trúng một một lần của một kỳ( dù người đó có nhiều code) hoặc không
- Mặc định code đã trúng sẽ bị loại ra khỏi list code sẽ trúng  khi quay giải hệ thống tự chọn ramdom người trúng giải
- Các giải nếu quá số người nhận trên giao diên quay số có thể chọn quay thêm cần modal confrim quay thêm xác nhận
- Cho phép cài đặt background của nền quay số kỳ quay số, Cài đặt giải số phần thưởng ảnh và tên  thông tin của giải thưởng

1. giao diên quay số hiệu ứng quay như kengsington lock:  giao diện các ô số quay số kiểu kengsington ở giữa khung hình bên dưới là nút quay số
góc trên bên trái là nút Hamburger menu cho phép mở ra để chọn giải của kỳ quay, auto vào url quayso là kỳ quay mới nhất hệ thống, có thể vào id tương ứng của kỳ quay để tiếp tục quay các giải của kỳ quy đó
sau khi quay  giải xong mà hết lượt quay thì sẽ lock menu chọn giải đó muốn quay quá số lượt cần modal confirm như đã nói
sau khi chọn giải thì giải thưởng có thể bật hiển thị lên hoặc không ở bên trên  vùng quay số, có hiệu ứng di chuyển effect tới đó càng tốt, cót nút ... góc trên bên phải của hình ảnh giải đó để xem thông tin chi tiết của phần thưởng đã nhập
			
3 khi quay số sẽ quay và ra số tưởng ứng khi xong sẽ hiển thị modal bên trên show mã trúng thưởng và tên thông tin người trúng
- thông tin người trúng đó sẽ gồm tên và số diện thoại bị là xxx 3 số cuối vì 1 người có thể có nhiều mà code quay số nên cần db relationship nếu người đó trúng rồi sẽ loại toàn bộ code người đó khỏi danh sách sẽ trúng nếu ramdom tương ứng với cài đặt cho trúng một giải hay nhiều giải				
4. Giao diện cài đặt cho phép tạo kỳ quay và cài đặt đặt các giải, ảnh và thông tin của phần thưởng đó , số người trúng của giải , chỉ đính người trúng của giải là ai autocomplate chọn nhiều code tương ứng với số người sẽ trúng của giải tên giải 
phép import file excel người và mã code tương ứng, import file mã code trúng và giải tương ứng cùa kỳ	
cài đặt background của kỳ quay			
6 trang lịch sử url /lucky_history đã trúng giải của lượt của kỳ quay sẽ mặc định kỳ quay gần nhất, thông tin của kỳ quay hiển thị ở mô tả ở đầu bên dưới là thông tin nếu chưa quay là table trống ghi kỳ quay chưa thực hiện
có thể xem lịch sử kỳ quay cũ qua path id tưởng ứng
						
Cấu trúc dùng sqlite làm database , nuxt render fe dự theo DockerFile và dockercompore tương ứng đẻ chạy
Tạo thêm cho tôi DockerFileBuild để tôi build đóng gói dự án chuyển đi		
và tạo thêm cho tôi build thành Progressive Web App càng tốt	
									