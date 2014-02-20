var app = angular.module('docs', []);

app.controller('MenuCtrl', ['$scope', function($scope){
	$scope.active = false;
	
	$scope.click = function() {
		$scope.active = !$scope.active 
		
		if ($scope.$parent.current.active) {
			$scope.$parent.current.click(false);
		}
		$scope.$parent.current = $scope; 
	};
}]);	